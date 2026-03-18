import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OcrResult {
  montant: number;
  devise: string;
  date: string;
  fournisseur: string;
  categorie: string;
  taux_tva: string;
  description: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { image_url } = await req.json();

    if (!image_url) {
      return new Response(
        JSON.stringify({ error: 'image_url is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    // Download the image
    const imageResponse = await fetch(image_url);
    if (!imageResponse.ok) {
      throw new Error('Failed to download image');
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(imageBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    // Determine media type from URL or default to jpeg
    let mediaType = 'image/jpeg';
    if (image_url.toLowerCase().includes('.png')) {
      mediaType = 'image/png';
    } else if (image_url.toLowerCase().includes('.webp')) {
      mediaType = 'image/webp';
    } else if (image_url.toLowerCase().includes('.gif')) {
      mediaType = 'image/gif';
    }

    // Call Anthropic Claude Vision API
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: `Analyse ce reçu et extrais les informations suivantes au format JSON strictement structuré.

Retourne UNIQUEMENT un objet JSON valide avec ces champs:
- montant: le montant total (nombre décimal, par exemple 42.50)
- devise: la devise (CHF, EUR, ou USD)
- date: la date au format YYYY-MM-DD (par exemple 2026-02-18)
- fournisseur: le nom du fournisseur/magasin
- categorie: la catégorie la plus appropriée parmi: "Fournitures de bureau", "Matériel informatique", "Frais de déplacement", "Repas & Restauration", "Formation", "Abonnements", "Téléphonie", "Marketing", "Loyer", "Assurances", "Autres"
- taux_tva: le taux de TVA applicable en Suisse (8.1, 3.8, 2.6, ou 0)
- description: une brève description des articles/services

Exemple de réponse attendue:
{
  "montant": 42.50,
  "devise": "CHF",
  "date": "2026-02-18",
  "fournisseur": "Migros",
  "categorie": "Fournitures de bureau",
  "taux_tva": "8.1",
  "description": "Papier A4, stylos"
}

Important: Ne retourne QUE le JSON, sans texte avant ou après.`,
              },
            ],
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error('Anthropic API error:', errorText);
      throw new Error(`Anthropic API error: ${anthropicResponse.status}`);
    }

    const anthropicData = await anthropicResponse.json();

    // Extract the text content from Claude's response
    const textContent = anthropicData.content.find((c: any) => c.type === 'text')?.text;
    if (!textContent) {
      throw new Error('No text content in Claude response');
    }

    // Parse the JSON from Claude's response
    // Remove any markdown code blocks if present
    let jsonText = textContent.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const ocrResult: OcrResult = JSON.parse(jsonText);

    // Validate the result
    if (!ocrResult.montant || !ocrResult.devise || !ocrResult.date || !ocrResult.fournisseur) {
      throw new Error('Invalid OCR result: missing required fields');
    }

    // Ensure taux_tva is a string
    if (typeof ocrResult.taux_tva === 'number') {
      ocrResult.taux_tva = ocrResult.taux_tva.toString();
    }

    return new Response(
      JSON.stringify(ocrResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in ocr-scan function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
