# TWBot

Ferramentas de automação para Tribal Wars, em userscript.

| Ferramenta | Onde aparece no jogo | O que faz |
|---|---|---|
| [Auto Farming Inteligente](AutoFarmingInteligente.user.js) | Assistente de Saque | Saqueia com ritmo humanizado e aprende o mínimo de tropas de cada aldeia |
| [Construtor Automático](ConstrutorAutomatico.user.js) | Edifício Principal | Constrói seguindo modelo ou missões, e coleta recompensas que cabem no armazém |
| [Agendador de Comandos](AgendadorDeComandos.user.js) | Bloco de Notas | Envia ataque e apoio na hora marcada, no milésimo |

## Instalar

1. Instale o [Tampermonkey](https://www.tampermonkey.net/) no seu navegador.
2. Clique no nome da ferramenta na tabela acima.
3. Clique em **Raw** e o Tampermonkey abre a tela de instalação.

As atualizações são automáticas — não é preciso reinstalar quando sair versão nova.

## Como funciona

O que você instala é um carregador de 40 linhas, legível. Ele busca a ferramenta
no servidor a cada carregamento de página. Isso significa que correções chegam
sem você fazer nada.

## Precisão do agendador

Medido em servidor real, chegada pedida às `12:35:00.000`:

```
chegada real   12:35:00.024      erro de +24 ms
```

O bot lê no jogo a chegada real de cada comando enviado, compara com a que foi
pedida, e usa a diferença para corrigir o próximo envio. O atraso converge em
vez de ficar preso numa média.

## Aviso

Automatizar o jogo é contra as regras da InnoGames, e o risco de punição é de
quem usa. O agendamento de comandos é o mais fiscalizado dos três.

Estas ferramentas não escondem nada do jogo: não interferem na verificação
anti-bot nem na telemetria. Se aparecer um captcha, elas param.
