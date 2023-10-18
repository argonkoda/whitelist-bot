import {config} from 'dotenv';

config();


import {sendCommand} from './rcon.js';
import fetch from 'node-fetch';

async function getToken() {
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

const token = await getToken();

import { readFile, writeFile } from 'node:fs/promises';

const users = new Map(JSON.parse(await readFile('./users.json', 'utf-8').catch(err=>{console.log("Users file not found, defaulting to blank."); return '[]'})));

function saveUsers() {
  writeFile('./users.json', JSON.stringify(Array.from(users.entries())), 'utf-8');
}

import { Client, GatewayIntentBits, Partials } from 'discord.js';
const client = new Client({ intents: [GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers], partials: [Partials.GuildMember] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  const {username, subscribed} = users.get(newMember.id);
  console.log(`Guild member update '${newMember.user.globalName}'[${newMember.id}]`);
  if (username) {
    console.log(`Tracked user '${newMember.user.globalName}'[${newMember.id}] has been updated. Checking roles...`)
    // const hadRole = !!oldMember.roles.resolve(process.env.SUBSCRIBER_ROLE_ID);
    const hasRole = !!newMember.roles.resolve(process.env.SUBSCRIBER_ROLE_ID);
    if (subscribed !== hasRole) {
      console.log(`User '${newMember.user.globalName}'[${newMember.id}] has ${hasRole?"gained":"lost"} the subscriber role. Updating whitelist...`)
      const result = await sendCommand(`whitelist ${hasRole?'add':'remove'} ${username}`, process.env.RCON_HOST, process.env.RCON_PORT, process.env.RCON_PASSWORD);
      users.set(newMember.id, {username, subscribed: hasRole});
      saveUsers();
      console.log("Done: " + result);
    } else {
      console.log("Role was not updated.")
    }
  }
})

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const username = interaction.options.getString('username', true);
  if (interaction.commandName === 'link') {
    if (interaction.member.roles.resolve(process.env.SUBSCRIBER_ROLE_ID)) {
      try {
        await interaction.deferReply();
        const result = await sendCommand('whitelist add ' + username, process.env.RCON_HOST, process.env.RCON_PORT, process.env.RCON_PASSWORD);
        if (result === "That player does not exist") {
          await interaction.editReply(`The username ${username} doesn't exist.`);
        } else {
          users.set(interaction.user.id, {username, subscribed: true});
          saveUsers();
          await interaction.editReply(`Linked with ${username}!`);
        }
      } catch (error) {
        console.error("Failed to whitelist",error);
        await interaction.editReply(`Something went wrong. Please try again later.`);
      }
    } else {
      await interaction.reply(`You must be a subscriber to join the server.`);
    }
  }
});

client.login(process.env.BOT_TOKEN);
