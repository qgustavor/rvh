# Revit Version Handler

*(Only available in Portuguese at the moment)*

Ferramenta que permite que a versão correta do Revit seja aberta ao abrir os arquivos, dispensando ter que monitorar (seja no nome do arquivo ou fora dele) a versão utilizada.

Baixe o rvh.exe aqui: https://github.com/qgustavor/rvh/releases/latest

## Instalação substituindo o comando de abertura

1. Abra o regedit.exe
2. Abra a chave `HKEY_CLASSES_ROOT\Revit.Project\shell\open\command`
3. No `(default)` coloque o caminho para o "rvh.exe" seguido de `"%1"`. Exemplo: `"C:\Usuário\Documentos\rvh.exe" "%1"`
4. Teste abrindo algum projeto do Revit, ele irá detectar a versão do arquivo e abrir a versão apropriada do Revit.

## Instalação com nova opção

Caso queira é possível configurar o Windows adicionando mais uma opção ao menu, mantendo a funcionalidade original e reduzindo o risco de problemas

1. Abra o regedit.exe
2. Abra a chave `HKEY_CLASSES_ROOT\Revit.Project\shell`
3. Crie uma chave chamada `rvh`
4. No `(default)` coloque `Abrir (detectar versão)`
5. Dentro da nova chave crie uma chave chamada `command`
6. No `(default)` coloque o caminho para o "rvh.exe" seguido de `"%1"`. Exemplo: `"C:\Usuário\Documentos\rvh.exe" "%1"`
7. Teste abrindo algum projeto do Revit com o botão direito e apertando em "Abrir (detectar versão)", ele irá detectar a versão do arquivo e abrir a versão apropriada do Revit.

## Funções implementadas

- Detecção da versão do arquivo Revit carregado usando [@phi-ag/rvt](https://github.com/phi-ag/rvt)
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
    - Basta detectar se uma instância do Revit já está aberta e enviar o comando `[open("%1")]` para ela (onde `%1` é o caminho do arquivo). Agora como enviar que é complicado: o [node-dde](https://github.com/iblislin/node-dde) não é atualizado faz 12 anos e estamos usando Bun.
