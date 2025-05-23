import { basicFileInfo } from '@phi-ag/rvt'
import { openPath } from '@phi-ag/rvt/node'
import { execFile, spawn } from 'child_process'
import { promisify } from 'util'
import colors from 'yoctocolors'
import prompts from 'prompts'
import boxen from 'boxen'
import path from 'path'
import pkgInfo from './package.json' with { type: 'json' }
import fs from 'fs'

// TODO handle locales
const execFilePromise = promisify(execFile)

async function main () {
  console.clear()
  const boxenSettings = {
    padding: 1,
    textAlignment: 'center',
    float: 'center'
  }

  // Ignore arguments starting with -- and /
  const filePath = process.argv.slice(2).find(e => {
    return !e.startsWith('--') && !e.startsWith('/')
  })

  process.title = 'Revit Version Handler ' + pkgInfo.version

  if (!filePath) {
    console.log(colors.white(boxen('Você precisa configurar para abrir arquivos .rvt com esse programa', boxenSettings)))
    console.log('Criado por Gustavo Rodrigues (https://qgustavor.tk)')
    console.log('Documentação: https://github.com/qgustavor/rvh')
    console.log(`Versão: ${pkgInfo.version}\n`)

    await prompts({
      type: 'invisible',
      name: 'confirm',
      message: 'Aperte enter para continuar'
    })
    return
  }

  console.log(colors.gray(boxen('Processando arquivo...', boxenSettings)))

  let file, info
  try {
    file = await openPath(filePath)
    info = await basicFileInfo(file)
  } catch (err) {
    console.clear()
    console.log(colors.red(boxen('Erro ao carregar arquivo!', boxenSettings)))  
    console.log('Código do erro:', err.message)
    console.log('Verifique se o arquivo não está corrompido e tente novamente.\n')

    await prompts({
      type: 'invisible',
      name: 'confirm',
      message: 'Aperte enter para continuar'
    })
    return
  }

  const fileVersion = +info.version
  const versionInfo = await execFilePromise('reg', ['query', 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Autodesk\\Revit', '/s', '/f', 'InstallationLocation'])
  const versions = versionInfo.stdout.toString()
    .replaceAll('\r', '')
    .split('\n\n')
    .map(e => e.trim().split('\n'))
    .filter(e => e.length === 2)
    .map(e => [
      +e[0].match(/Revit\\(\d+)\\REVIT/)[1],
      e[1].split('REG_SZ')[1].trim()
    ])

  console.clear()
  if (versions.length === 0) {
    console.log(colors.red(boxen('Nenhuma versão do Revit encontrada!', boxenSettings)))
    await prompts({
      type: 'invisible',
      name: 'confirm',
      message: 'Aperte enter para continuar'
    })
    return
  }

  const exactVersion = versions.find(e => e[0] === fileVersion)
  if (exactVersion) {
    console.log(colors.green(boxen('Abrindo Revit ' + fileVersion, boxenSettings)))
    await openRevit(exactVersion, filePath)
    return
  }

  const newerVersions = versions.filter(e => e[0] > fileVersion)
  if (newerVersions.length === 0) {
    console.log(colors.red(boxen('Nenhuma versão do Revit compatível encontrada!', boxenSettings)))
    await prompts({
      type: 'invisible',
      name: 'confirm',
      message: 'Aperte enter para continuar'
    })
    return
  }

  console.log(colors.white(boxen(`Versão ${colors.underline(colors.green(fileVersion))} do Revit não encontrada!`, boxenSettings)))
  const answer = await prompts({
    type: 'select',
    name: 'confirm',
    message: 'Escolha o que fazer',
    hint: 'use as setas do teclado para escolher uma opção',
    choices: [
      { title: 'Cancelar', value: -1 },
      ...newerVersions.map(versionInfo => ({
        title: `Abrir na versão ${versionInfo[0]}`,
        description: 'o arquivo será atualizado',
        value: versionInfo
      }))
    ]
  })
  if (answer.confirm === -1) {
    console.clear()
    console.log(colors.gray(boxen('Operação cancelada', boxenSettings)))
    return
  }

  const makeCopy = (await prompts({
    type: 'toggle',
    name: 'copy',
    message: 'Fazer uma cópia do arquivo antes de abrir na nova versão?',
    initial: true,
    active: 'Sim',
    inactive: 'Não'
  })).copy

  let finalFilePath = filePath
  if (makeCopy) {
    const oldVersion = fileVersion
    const newVersion = answer.confirm[0]
    const newFilePath = getNewFileName(filePath, oldVersion, newVersion)
    if (!fs.existsSync(newFilePath)) {
      await fs.promises.copyFile(filePath, newFilePath)
    }
    finalFilePath = newFilePath
  }

  await openRevit(answer.confirm, finalFilePath)
}

function openRevit ([versionNumber, versionFolder], filePath) {
  // TODO handle DDE
  const revitPath = path.join(versionFolder, 'Revit.exe')
  spawn(revitPath, [filePath], {
    stdio: 'ignore',
    detached: true
  }).unref()
}

function getNewFileName (filePath, oldVersion, newVersion) {
  const dir = path.dirname(filePath)
  const ext = path.extname(filePath)
  const base = path.basename(filePath, ext)
  const versionRegex = new RegExp(`([_\\- ]?)${oldVersion}(?=[^\\d]|$)`)
  if (versionRegex.test(base)) {
    const newBase = base.replace(versionRegex, `$1${newVersion}`)
    return path.join(dir, newBase + ext)
  } else {
    return path.join(dir, `${base}_${newVersion}${ext}`)
  }
}

main().catch(error => {
  console.log(error)
  process.exit(1)
})
