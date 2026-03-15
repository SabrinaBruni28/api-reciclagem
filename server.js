import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const categorias = [
  "multimaterial",
  "vidro",
  "plástico",
  "papel",
  "metal",
  "orgânico",
];

app.post("/reciclagem", async (req, res) => {
  let { item } = req.body;

  // validação de entrada
  if (typeof item !== "string" || !item.trim() || item.length > 50) {
    return res.status(400).json({ erro: "item inválido" });
  }

  // normalização
  const itemNormalizado = item.trim().toLowerCase();

  try {
    const prompt = `
Você é especialista em reciclagem urbana no Brasil.

CONTEXTO:
Considere apenas a reciclagem da coleta seletiva comum das cidades brasileiras, com triagem manual em cooperativas.

DEFINIÇÃO:
Reciclável = item normalmente aceito na coleta seletiva para reciclagem industrial comum após triagem.

NÃO CONSIDERAR:
- compostagem
- reutilização
- reaproveitamento
- reciclagem industrial especializada rara
- reciclagem têxtil
- processos industriais incomuns

REGRAS IMPORTANTES:

1) Resíduos orgânicos NÃO são recicláveis.

2) Resíduos têxteis NÃO são recicláveis na coleta seletiva comum, pois exigem triagem e processamento especializado.

3) A coleta seletiva comum prioriza EMBALAGENS (garrafas, latas, frascos, caixas).

4) Objetos domésticos pequenos (pente, brinquedos, utensílios) geralmente NÃO são aceitos na triagem. 
Exceto se forem EMBALAGENS de plástico, metal ou vidro (frascos, garrafas, potes), que SÃO recicláveis.

5) Itens multimaterial geralmente NÃO são recicláveis na coleta seletiva comum porque os materiais não são separados manualmente nas cooperativas.

6) Classifique o item pelo MATERIAL PREDOMINANTE.

7) Use "multimaterial" APENAS quando não houver material predominante claro.

Exemplos corretos:
- frasco de perfume → vidro
- garrafa de azeite → vidro
- garrafa pet → plástico
- caixa de leite (Tetra Pak) → papel
- bola de futebol → multimaterial
- sapato → multimaterial

8) Mesmo que o item NÃO seja reciclável, informe o tempo aproximado de decomposição no meio ambiente.

9) Use intervalos amplamente aceitos em educação ambiental. Evite valores muito específicos ou irreais.

10) Embalagens laminadas ou multicamadas geralmente NÃO são recicláveis na coleta seletiva comum.

Exemplos:
- tubo de pasta de dente
- pacote de salgadinho
- embalagem metalizada
- sachês

Esses itens devem ser classificados como:
categoria = multimaterial
reciclavel = Não

CATEGORIAS PERMITIDAS:
${categorias.join(", ")}

REGRAS OBRIGATÓRIAS:

- Use no máximo 2 fontes
- URLs reais
- Preferir fontes .gov .org .edu
- Não invente URLs
- Não escreva texto fora do JSON
- Nunca use "não se aplica"
- Retorne apenas UM objeto JSON
- Não gere múltiplos JSON
- Não repita exemplos

FORMATO OBRIGATÓRIO:

{
 "item": "nome do item",
 "reciclavel": "Sim ou Não",
 "categoria": "uma das categorias",
 "tempo_decomposicao": "intervalo aproximado, ex: de 1 a 5 meses, de 100 a 400 anos",
 "explicacao": "explique em 1 ou 2 frases por que o item é ou não reciclável na coleta seletiva comum e o motivo da classificação da categoria"
}

Item para classificação: "${itemNormalizado}"

EXEMPLOS:

Item: casca de banana
Resposta:
{
 "item":"casca de banana",
 "reciclavel":"Não",
 "categoria":"orgânico",
 "tempo_decomposicao":"de 1 a 5 meses",
 "explicacao":"A casca de banana é um resíduo orgânico biodegradável. Na coleta seletiva comum ela não é reciclada, sendo normalmente descartada como lixo orgânico."
}

Item: garrafa pet
Resposta:
{
 "item":"garrafa pet",
 "reciclavel":"Sim",
 "categoria":"plástico",
 "tempo_decomposicao":"de 100 a 400 anos",
 "explicacao":"A garrafa PET é feita de plástico reciclável amplamente aceito na coleta seletiva. Após a triagem, pode ser reciclada para produzir novas embalagens ou fibras plásticas."
}
`;

    const response = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0,
      max_tokens: 200,
    });

    const text = response.choices[0].message.content;

    let data;

    // extrair JSON da resposta
    try {
      const jsonMatch = text.match(/\{[\s\S]*?\}/);

      if (!jsonMatch) {
        return res.status(500).json({
          erro: "IA não retornou JSON válido",
          resposta: text,
        });
      }

      let jsonText = jsonMatch[0].trim();

      try {
        data = JSON.parse(jsonText);
      } catch {
        return res.status(500).json({
          erro: "erro ao interpretar resposta da IA",
          resposta: text,
        });
      }
    } catch (err) {
      return res.status(500).json({
        erro: "erro ao interpretar resposta da IA",
        resposta: text,
      });
    }

    // validação dos campos
    if (!data.item) data.item = itemNormalizado;

    if (!data.reciclavel) data.reciclavel = "Desconhecido";

    if (!data.tempo_decomposicao) data.tempo_decomposicao = "desconhecido";

    // validar categoria
    if (!categorias.includes(data.categoria)) {
      data.categoria = "multimaterial";
    }

    if (!data.explicacao) {
      data.explicacao = "Explicação não disponível.";
    }

    data.explicacao = data.explicacao.substring(0, 500);

    res.json({
      item: data.item,
      reciclavel: data.reciclavel,
      categoria: data.categoria,
      tempo_decomposicao: data.tempo_decomposicao,
      explicacao: data.explicacao,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      erro: "erro ao consultar IA",
    });
  }
});

app.get("/", (req, res) => {
  res.json({
    status: "API reciclagem online",
  });
});

app.listen(3000, () => {
  console.log("Servidor rodando: http://localhost:3000/");
});
