# API de pagamento TURBOGELO (Vercel + Aurionfy)

Esta pasta contém só a parte de **servidor** do checkout. Os arquivos do site
(`index.html`, `checkout/`, `img/`, etc.) continuam no seu repositório e
não mudam.

## O que vai para o repositório

Coloque estes itens na **raiz** do repositório, no mesmo nível do `index.html`:

```
api/                 ← pasta inteira
package.json
package-lock.json
vercel.json
```

Se o repositório já tiver um `package.json` ou um `vercel.json`, me avise
antes de substituir.

## Variáveis na Vercel

Em **Vercel → projeto → Settings → Environment Variables**, marque **Production**:

| Nome                  | Valor                                          |
| --------------------- | ---------------------------------------------- |
| `AURIONFY_PUBLIC_KEY` | sua chave pública da Aurionfy (`pk_...`)       |
| `AURIONFY_SECRET_KEY` | sua chave secreta da Aurionfy (`sk_...`)       |

As duas chaves estão no painel da Aurionfy. Depois de salvar, faça um
**Redeploy**.

Opcional: `CHECKOUT_DESATIVADO` = `true` desliga o botão de pagar sem tirar o
site do ar.

## Rotas

| Rota                          | Função                                        |
| ----------------------------- | --------------------------------------------- |
| `GET  /api/checkout/config`   | preços, frete e chave pública                 |
| `POST /api/checkout/quote`    | recalcula o total no servidor                 |
| `POST /api/checkout/create`   | cria a venda na Aurionfy (Pix, boleto, cartão)|
| `GET  /api/checkout/status`   | consulta o status do pedido na Aurionfy       |
| `POST /api/checkout/postback` | recebe os avisos da Aurionfy (só registra)    |
| `GET  /precos.js`             | preços para a página da loja                  |

## Se der erro

Abra **Vercel → projeto → Logs** e procure por `[checkout/create] Aurionfy
respondeu`. A linha mostra o código e a mensagem exata da Aurionfy.
