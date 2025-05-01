import { basicFileInfo } from '@phi-ag/rvt'
import { openPath } from '@phi-ag/rvt/node'
import { execFile, spawn } from 'child_process'
import { promisify } from 'util'
import colors from 'yoctocolors'
import prompts from 'prompts'
import boxen from 'boxen'
import path from 'path'

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
    return !e.startsWith('--') && e.startsWith('/')
  })

  process.title = 'Revit Version Handler'

  if (!filePath) {
    console.log(colors.white(boxen('Você precisa configurar para abrir arquivos .rvt com esse programa', boxenSettings)))
    console.log('1. Abra o regedit.exe')
    console.log('2. Abra a chave HKEY_LOCAL_MACHINE\\SOFTWARE\\Classes\\Revit.Project\\shell\\open\\command')
    console.log('3. Coloque o caminho deste aplicativo no lugar do Revit')
    console.log('4. Teste abrindo algum projeto do Revit, ele irá detectar a versão do arquivo e abrir a versão apropriada do Revit.')
    console.log('\nCriado por Gustavo Rodrigues (https://qgustavor.tk)\n')

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
        description: 'o arquivo será atualizado, salve com outro nome',
        value: versionInfo
      }))
    ]
  })
  if (answer.confirm === -1) {
    console.clear()
    console.log(colors.gray(boxen('Operação cancelada', boxenSettings)))
    return
  }

  await openRevit(answer.confirm, filePath)
}

function openRevit ([versionNumber, versionFolder], filePath) {
  // TODO handle DDE
  const revitPath = path.join(versionFolder, 'Revit.exe')
  spawn(revitPath, [filePath], {
    stdio: 'ignore',
    detached: true
  }).unref()
}

main().catch(error => {
  console.log(error)
  process.exit(1)
})
