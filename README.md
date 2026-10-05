# TWBot

Ferramentas de automação para Tribal Wars, em userscript.

| Ferramenta | Onde aparece no jogo | O que faz |
|---|---|---|
| Auto Farming Inteligente | Assistente de Saque | Saqueia com ritmo humanizado e aprende o mínimo de tropas de cada aldeia |
| Construtor Automático | Edifício Principal | Constrói seguindo modelo ou missões, e coleta recompensas que cabem no armazém |
| Agendador de Comandos | Bloco de Notas | Envia ataque e apoio na hora marcada, no milésimo |
| Auto Recrutamento | Recrutar | Mantém metas de tropa por grupo de aldeias, dentro dos recursos e da fila |
| Defesa | Chegando | Etiqueta cada ataque recebido com a unidade (pelo tempo de viagem ou, exata, pela torre de vigia), marca trens de nobre, avisa provável fake e dá a nota de risco de cada aldeia (quantos fulls aguenta e se segura os ataques que vêm) |

## Instalar

1. Instale o [Tampermonkey](https://www.tampermonkey.net/) no seu navegador.
2. Abra o [TWBot.user.js](TWBot.user.js).
3. Clique em **Raw** e o Tampermonkey abre a tela de instalação.

É um script só para todas as ferramentas. Elas aparecem no ícone de cada uma na barra lateral, em
qualquer tela, e rodam em qualquer aba do jogo: ligada fica ligada até você parar, e se a aba mudar de
tela ou fechar, outra aba aberta continua. As atualizações são automáticas — não é preciso reinstalar
quando sair versão nova.

### Se você tem os scripts antigos

Antes havia um script por ferramenta. Instale o TWBot e, no painel do Tampermonkey, remova os
antigos (Auto Farming Inteligente, Construtor Automático, Agendador de Comandos, Auto Recrutamento).
Enquanto eles estiverem lá, não atrapalham: com o TWBot instalado, ficam parados.

## Como funciona

O que você instala é um carregador curto e legível. Ele busca as ferramentas no servidor e guarda
uma cópia no navegador, que só é baixada de novo quando sai versão nova. A licença é conferida a
cada página.

Antes de executar qualquer coisa, o carregador confere a assinatura digital do código. Só roda o
que foi assinado pelo TWBot: se alguém invadisse o servidor, não conseguiria mandar código para o
seu navegador.

Se aparecer um captcha numa aba, as ferramentas param em todas as abas daquele mundo.

## Controlar pelo celular

O ícone de celular no cabeçalho de qualquer ferramenta liga o painel web: dele
você vê o que cada ferramenta está fazendo, inicia e para, acompanha o registro
e recebe aviso de ataque chegando e de captcha. O bot continua rodando no PC; o
celular só comanda. O acesso nasce desligado, e quem tiver o link comanda o bot
da conta, então não o compartilhe.

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
quem usa. O agendamento de comandos é o mais fiscalizado de todos.

Estas ferramentas não escondem nada do jogo: não interferem na verificação
anti-bot nem na telemetria. Se aparecer um captcha, elas param.
