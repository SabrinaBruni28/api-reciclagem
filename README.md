# API de Reciclagem Urbana

Esta API classifica itens quanto à sua reciclabilidade na **coleta seletiva comum** do Brasil.  
Ela informa se o item é reciclável, a categoria (plástico, vidro, papel, metal, orgânico ou multimaterial), o tempo de decomposição e uma explicação resumida.

## Como usar

### 1. Status da API

```http
GET /
```

**Resposta:**

```json
{
  "status": "API reciclagem online"
}
```

### 2. Classificar um item

```http
POST /reciclagem
Content-Type: application/json

{
  "item": "frasco de shampoo"
}
```

**Exemplo de resposta:**

```json
{
  "item": "frasco de shampoo",
  "reciclavel": "Sim",
  "categoria": "plástico",
  "tempo_decomposicao": "de 100 a 400 anos",
  "explicacao": "O frasco de shampoo é feito de plástico reciclável. Após a triagem, pode ser reciclado para produzir novas embalagens ou fibras plásticas."
}
```

## Ideia da API

- Classifica itens de acordo com a coleta seletiva urbana comum.  
- Itens orgânicos e têxteis não são considerados recicláveis na triagem normal.  
- Itens com materiais inseparáveis (multimaterial) não são recicláveis.  
- Usa inteligência artificial (Llama 3.1 / OpenAI) para fornecer respostas consistentes e explicações.

## Rodando localmente

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/pi-reciclagem.git
cd pi-reciclagem
```

2. Instale dependências:

```bash
npm install
```

3. Configure a variável de ambiente:

```env
GROQ_API_KEY=SEU_API_KEY
```

4. Rode a API:

```bash
node server.js
```

A API estará disponível em: `http://localhost:3000/`


