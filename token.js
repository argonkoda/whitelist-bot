import fetch from 'node-fetch';

export async function getToken() {
  const refreshToken = await readFile('./token.txt', 'utf-8');
  const data = new FormData();
  data.set('grant_type', 'refresh_token');
  data.set('refresh_token', refreshToken);
  const response = await fetch('https://discord.com/api/v10/oauth2/token', {
    method: 'POST',
    body: data,
    headers: {
      "Authorization": `Basic ` + btoa(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`)
    }
  });
  const json = await response.json();
  console.log(response.headers, json);
  await writeFile('token.txt', json.refresh_token, 'utf-8');
  return json.access_token;
}