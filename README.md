# Revit Version Handler

*(Only available in Portuguese at the moment)*

Ferramenta que permite que a versão correta do Revit seja aberta ao abrir os arquivos, dispensando ter que monitorar (seja no nome do arquivo ou fora dele) a versão utilizada.

## Instalação

1. Abra o regedit.exe
2. Abra a chave `HKEY_LOCAL_MACHINE\\SOFTWARE\\Classes\\Revit.Project\\shell\\open\\command`
3. Coloque o caminho deste aplicativo no lugar do Revit'
4. Teste abrindo algum projeto do Revit, ele irá detectar a versão do arquivo e abrir a versão apropriada do Revit.

## Funções implementadas

- Detecção da versão do arquivo Revit carregado usando (@phi-ag/rvt)[https://github.com/phi-ag/rvt]
- Detecção das versões do Revit instaladas na máquina usando o comando `reg` do Windows
- Abertura automática do Revit caso a versão exata do arquivo seja encontrada
- Caso a versão do arquivo não seja encontrada, o programa procura versões mais novas e, existindo, pergunta ao usuário se deseja usar alguma delas
- Mensagens de erro caso um arquivo corrompido seja aberto ou caso o programa seja executado de forma incorreta

## Funções a serem implementadas

- Outras línguas além de Português
  - People are welcome to implement i18n and translate this project into their language
- Suporte a Dynamic Data Exchange (DDE) para permitir abrir os projetos em instâncias já abertas do Revit
    - É necessário pois da forma que esse programa funciona no momento uma instância nova do Revit é sempre aberta
    - Além disso, duas instâncias separadas do Revit não conseguem copiar elementos de uma para a outra.
