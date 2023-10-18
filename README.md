# Whitelist Bot

A simple discord bot to link a minecraft server whitelist to discord accounts dependant on a role

## Commands

`/link <username>`  
Links the user with the provided username. The user must have the required role, the server must be online and the username must be a valid username.

## ENV Variables

| Variable | Description |
| --- | --- |
| `APPLICATION_ID` | Discord Application ID |
| `CLIENT_ID` | Discord Client ID |
| `CLIENT_SECRET` | Discord Client Secret |
| `BOT_TOKEN` | Discord Bot Token |
| `RCON_PORT` | Minecraft Server RCON port |
| `RCON_HOST` | Minecraft Server RCON host |
| `RCON_PASSWORD` | Minecraft Server RCON password |
| `SUBSCRIBER_ROLE_ID` | Discord RoleID for the subscriber role. |

## Scripts
- `index.js` The main bot script. Start this to run the bot.
- `auth.js` A tool to get initial OAuth2 tokens.
- `update_slash.js` A script to update the slash command definitions when needed

## Data Files
- `users.json` The list of tracked users and their names and subscription status.
- `token.txt` The current OAuth2 refresh token. Used for OAuth2 authed actions.