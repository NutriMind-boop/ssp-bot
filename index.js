require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.commands = new Collection();
const commandsArray = [];
const commandsPath = path.join(__dirname, 'comandos');

if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commandsArray.push(command.data.toJSON());
            console.log(`📌 Comando carregado: /${command.data.name}`);
        } else {
            console.log(`⚠️ O comando em ${filePath} está faltando a propriedade "data" ou "execute".`);
        }
    }
}

client.on('ready', async () => {
    console.log(`🤖 Bot online como ${client.user.tag}`);

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log('Sincronizando comandos com o Discord...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commandsArray }
        );
        console.log('✅ Todos os comandos foram registrados com sucesso!');
    } catch (error) {
        console.error('Erro ao sincronizar comandos:', error);
    }
});

client.on('interactionCreate', async (interaction) => {
    let commandName = '';

    if (interaction.isChatInputCommand()) {
        commandName = interaction.commandName;
    } else if (interaction.isUserSelectMenu() && interaction.customId === 'selecionar_policial') {
        commandName = 'avaliar-estagio';
    } else if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_avaliacao_')) {
        commandName = 'avaliar-estagio';
    }

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Erro ao executar o comando ${commandName}:`, error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Ocorreu um erro ao executar essa ação.', ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);