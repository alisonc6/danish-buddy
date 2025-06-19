const speech = require('@google-cloud/speech');

const client = new speech.SpeechClient();

exports.transcribeAudio = async (req, res) => {
  try {
    // Accept only POST
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    // Accept audio/webm or multipart/form-data
    let audioBuffer;
    if (req.headers['content-type'].includes('audio/webm')) {
      audioBuffer = req.rawBody;
    } else if (req.headers['content-type'].includes('multipart/form-data')) {
      res.status(400).json({ error: 'multipart/form-data not supported, send as audio/webm' });
      return;
    } else {
      res.status(400).json({ error: 'Unsupported content type' });
      return;
    }

    // Validate audio buffer
    if (!audioBuffer || audioBuffer.length === 0) {
      res.status(400).json({ error: 'No audio data received' });
      return;
    }

    // Google Speech-to-Text config
    const audio = { content: audioBuffer.toString('base64') };
    const config = {
      encoding: 'WEBM_OPUS',
      sampleRateHertz: 16000,
      languageCode: 'da-DK',
      enableAutomaticPunctuation: true,
      model: 'default',
      useEnhanced: true,
      audioChannelCount: 1
    };

    console.log('Sending request to Speech-to-Text API with config:', {
      encoding: config.encoding,
      sampleRateHertz: config.sampleRateHertz,
      languageCode: config.languageCode,
      audioSize: audioBuffer.length
    });

    const [response] = await client.recognize({ audio, config });

    if (!response.results || response.results.length === 0) {
      res.status(200).json({ text: '', message: 'No speech detected' });
      return;
    }

    const transcript = response.results.map(r => r.alternatives[0].transcript).join(' ').trim();
    res.status(200).json({ text: transcript });
  } catch (err) {
    console.error('Speech-to-Text error:', err);
    const errorMessage = err.message || 'Internal Server Error';
    const errorDetails = {
      message: errorMessage,
      code: err.code,
      details: err.details,
      metadata: err.metadata
    };
    res.status(500).json({ error: errorDetails });
  }
}; 