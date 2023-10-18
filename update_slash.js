import {config} from 'dotenv';
config();
import { REST, Routes } from 'discord.js';

const commands = [
  {
    name: 'link',
    description: 'Links your discord account with your Minecraft username for the server whitelist',
    options: [{
      type: 3,
      name: 'username',
      description: 'Your minecraft username',
      required: true,
    }]
  },
];

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

try {
  console.log('Started refreshing application (/) commands.');

  await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });

  console.log('Successfully reloaded application (/) commands.');
} catch (error) {
  console.error(error);
}