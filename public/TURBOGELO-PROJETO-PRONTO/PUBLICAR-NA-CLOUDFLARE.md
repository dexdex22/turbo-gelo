# TURBOGELO — publicação em turbogelo.online

Este é o projeto original atualizado. O pacote inclui a loja, checkout Aurionfy, fontes, imagens, catálogo, vídeos e Worker já compilado.

## 1. Preparar

Extraia o ZIP. Instale Node.js 22 ou superior. Abra o terminal dentro da pasta do projeto e execute:

```sh
npm ci
npx wrangler login
```

Entre na conta Cloudflare que administra `turbogelo.online`. O domínio precisa estar ativo nessa conta, com os nameservers indicados pela Cloudflare configurados no registrador.

## 2. Banco de pedidos D1

Se já existe um banco para esta loja, reutilize-o. No painel Cloudflare, abra **Storage & databases → D1** e copie seu ID. Caso não exista:

```sh
npx wrangler d1 create turbogelo-pedidos
```

No arquivo `wrangler.jsonc`, substitua `SUBSTITUA_PELO_ID_D1` pelo ID real. Se reutilizar outro nome de banco, ajuste também `database_name`. Mantenha o binding exatamente `DB`.

Crie as tabelas (não apaga pedidos existentes):

```sh
npx wrangler d1 execute turbogelo-pedidos --remote --file cloudflare/schema.sql
```

Se usou outro nome, substitua `turbogelo-pedidos` nesse comando. Alternativamente, cole o conteúdo de `cloudflare/schema.sql` no console do banco D1.

## 3. Publicar todos os arquivos

```sh
npx wrangler deploy
```

O comando publica o Worker e a pasta `public` inteira e configura `turbogelo.online` como domínio personalizado. Se houver um registro DNS ou outra aplicação ocupando o mesmo domínio, resolva o conflito na zona DNS antes de repetir a publicação. Não exclua registros de e-mail.

**Não basta colar `worker.js` no editor nem enviar só `public` pelo upload de site estático.** Este pacote usa Worker + Static Assets + D1. O binding `ASSETS` entrega fotos e vídeos, inclusive requisições parciais de vídeo. Nenhuma mídia é embutida no código do Worker.

## 4. Configurar a Aurionfy

Cadastre as chaves reais como Secrets em **Workers & Pages → turbogelo-loja → Settings → Variables and Secrets**, ou execute:

```sh
npx wrangler secret put AURIONFY_PUBLIC_KEY
npx wrangler secret put AURIONFY_SECRET_KEY
```

Cole cada valor apenas quando o terminal pedir. As chaves não estão incluídas no ZIP. Chaves existentes com os nomes canônicos são preservadas na publicação. O código também reconhece os nomes antigos em português.

Em `wrangler.jsonc`, `APP_ORIGIN` já está definido como `https://turbogelo.online`, sem barra final. Depois de configurar D1 e as chaves, altere `PAYMENTS_ENABLED` de `"false"` para `"true"` e execute novamente:

```sh
npx wrangler deploy
```

Mantenha a configuração no arquivo para que uma publicação futura não reverta alterações feitas somente no painel. A consulta periódica dos pagamentos está configurada a cada cinco minutos. Não é necessário `CRON_SECRET` para esse agendamento nativo.

## 5. Conferir antes de divulgar

Abra `https://turbogelo.online`, escolha frente/traseira e um modelo, avance para o checkout e confira os valores. Uma unidade custa R$ 144,90 (R$ 130,41 no Pix); duas custam R$ 194,90 (R$ 175,41 no Pix), antes do frete escolhido.

Abra `https://turbogelo.online/api/checkout/config`: `enabled: true` confirma a presença das configurações, mas **não comprova que as chaves são aceitas**. Faça uma compra controlada pela interface e confira pedido, pagamento e confirmação no painel Aurionfy. Pix, boleto, cartão e autenticação 3DS dependem das modalidades habilitadas pela sua conta.

O sistema envia automaticamente o callback de cada pedido em `postbackUrl`; não substitua por uma URL fixa sem o parâmetro do pedido. O webhook apenas confirma pagamento após consultar a API autenticada.

## Pendências comerciais herdadas

As políticas de privacidade, termos, trocas, entrega e garantia não foram fornecidas completas no projeto original. Os respectivos itens continuam identificados como pendentes no rodapé. Não foram inventados textos, prazos adicionais ou endereço de devolução.

O rodapé mantém nome empresarial, CNPJ, e-mail e WhatsApp do material original; sua titularidade e adequação à operação deste domínio não foram confirmadas. Revise esses dados e forneça as políticas antes de divulgar a loja como operação finalizada. Este ponto não é resolvido pela configuração da Cloudflare.

## Verificação e manutenção

`npm test` recompila o Worker e executa os testes. Depois de editar arquivos de `lib` ou `cloudflare`, execute `npm run build:cloudflare` antes de publicar. Alterações em fotos, vídeos, estilos e textos de `public` são enviadas por `wrangler deploy`.

Documentação de referência:
- https://developers.cloudflare.com/workers/static-assets/binding/
- https://developers.cloudflare.com/d1/get-started/
- https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- https://developers.cloudflare.com/workers/configuration/secrets/
