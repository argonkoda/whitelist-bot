import polka from 'polka';
import fetch from 'node-fetch';
import {config} from 'dotenv';

config();

polka().get('/', async (req, res) => {
  console.log(req.query);
  const code = req.query.code;
  const data = new FormData();
  data.set('code', code);
  data.set('grant_type', 'authorization_code');
  data.set('redirect_uri', 'http://localhost');
  const response = await fetch('https://discord.com/api/v10/oauth2/token', {
    method: 'POST',
    body: data,
    headers: {
      "Authorization": `Basic ` + btoa(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`)
    }
  });
  res.end(await response.text());
}).listen(80)