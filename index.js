import {config} from 'dotenv';

config();

import {sendCommand} from './rcon.js';
import { readFile, writeFile } from 'node:fs/promises';
import { Client, GatewayIntentBits, Partials } from 'discord.js';

const users = new Map(JSON.parse(await readFile('./users.json', 'utf-8').catch(err=>{console.log("Users file not found, defaulting to blank."); return '[]'})));

function saveUsers() {
  writeFile('./users.json', JSON.stringify(Array.from(users.entries())), 'utf-8');
}

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
  if (interaction.commandName === 'link') {
    const username = interaction.options.getString('username', true);
    console.log(`User '${interaction.member.user.globalName}'[${interaction.member.id}] has requested a link with username '${username}'`)
    if (interaction.member.roles.resolve(process.env.SUBSCRIBER_ROLE_ID)) {
      console.log("User has role.");
      const other = Array.from(users.entries()).find(([id,{username: otherUsername}]) => id !== interaction.member.id && username === otherUsername);
      if (other) {
        console.log(`The username '${username}' is already linked to ${other[0]}.`);
        await interaction.reply(`The username ${username} has already been linked to another user.`);
      } else {
        try {
          await interaction.deferReply();
          const result = await sendCommand('whitelist add ' + username, process.env.RCON_HOST, process.env.RCON_PORT, process.env.RCON_PASSWORD);
          if (result === "That player does not exist") {
            console.log(`The username '${username}' does not exist`)
            await interaction.editReply(`The username ${username} doesn't exist.`);
          } else {
            console.log(`User '${interaction.member.user.globalName}'[${interaction.member.id}] successfully linked with username '${username}' and added to whitelist`)
            users.set(interaction.user.id, {username, subscribed: true});
            saveUsers();
            await interaction.editReply(`Linked with ${username}!`);
          }
        } catch (error) {
          console.error("Failed to whitelist",error);
          await interaction.editReply(`Something went wrong. Please try again later.`);
        }
      }
    } else {
      console.log("User did not have the role.")
      await interaction.reply(`You must be a subscriber to join the server.`);
    }
  }
});

client.login(process.env.BOT_TOKEN);
