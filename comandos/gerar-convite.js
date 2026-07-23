const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    PermissionFlagsBits 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gerar-convite')
        .setDescription('Gera um link de convite real e um código de autenticação.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addIntegerOption(option =>
            option.setName('usos')
                .setDescription('Quantidade máxima de usos do convite')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('minutos')
                .setDescription('Duração do convite em minutos (0 para permanente)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo ou nome de quem receberá o convite')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('cargo')
                .setDescription('Cargo automático que a pessoa receberá ao entrar (Opcional)')
                .setRequired(false)),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            // Trata se veio de um comando Slash ou de um botão/modal adaptado
            let usos, minutos, motivo, cargo;

            if (interaction.isChatInputCommand()) {
                usos = interaction.options.getInteger('usos');
                minutos = interaction.options.getInteger('minutos');
                motivo = interaction.options.getString('motivo');
                cargo = interaction.options.getRole('cargo');
            } else {
                // Fallback caso seja acionado por painel sem options de barra
                usos = 1;
                minutos = 60;
                motivo = 'Gerado via Painel';
                cargo = null;
            }

            // Criação real do convite no canal atual do Discord
            const invite = await interaction.channel.createInvite({
                maxUses: usos,
                maxAge: minutos === 0 ? 0 : minutos * 60,
                reason: motivo
            });

            // Gera o código de autenticação aleatório (ex: aut-123456)
            const numeroAleatorio = Math.floor(100000 + Math.random() * 900000);
            const codigoAutenticacao = `aut-${numeroAleatorio}`;

            // Se um cargo foi definido, guarda vinculado ao código de autenticação
            if (cargo) {
                if (!interaction.client.convitesCargos) {
                    interaction.client.convitesCargos = new Map();
                }
                interaction.client.convitesCargos.set(invite.code, cargo.id);
                interaction.client.convitesCargos.set(codigoAutenticacao, cargo.id);
            }

            const textoMinutos = minutos === 0 ? 'Permanente' : (minutos === 1 ? '1 minuto' : `${minutos} minutos`);

            // Embed privada de confirmação para quem usou o comando
            const embedResposta = new EmbedBuilder()
                .setTitle('🔑 CONVITE E CÓDIGO GERADOS')
                .setColor('#00FF00')
                .setDescription('Envie o link do convite real e o código de autenticação abaixo para o usuário.')
                .addFields(
                    { name: '🔗 Link do Convite', value: `${invite.url}`, inline: false },
                    { name: '🔑 Código de Autenticação', value: `\`\`\`${codigoAutenticacao}\`\`\``, inline: false },
                    { name: '⏳ Validade', value: `\`${textoMinutos}\``, inline: true },
                    { name: '👥 Limite de Usos', value: `\`${usos}\``, inline: true },
                    { name: '🎭 Cargo Vinculado', value: cargo ? `${cargo}` : '`Nenhum`', inline: true },
                    { name: '📝 Motivo', value: `\`${motivo}\``, inline: false }
                )
                .setFooter({ text: 'SSP • Sistema Policial' })
                .setTimestamp();

            // Envio da log no canal de logs de convite
            const ID_CANAL_LOGS = process.env.CANAL_LOGS_CONVITE_ID || process.env.CANAL_LOGS_ID || '1529612706624176292';
            let canalLogs = interaction.guild.channels.cache.get(ID_CANAL_LOGS);

            if (!canalLogs && ID_CANAL_LOGS) {
                canalLogs = await interaction.guild.channels.fetch(ID_CANAL_LOGS).catch(() => null);
            }

            if (canalLogs) {
                const embedLog = new EmbedBuilder()
                    .setTitle('🎟️ REGISTRO DE CONVITE / AUTENTICAÇÃO')
                    .setColor('#2F3136')
                    .addFields(
                        { name: '👤 Responsável', value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: false },
                        { name: '1️⃣2️⃣3️⃣4️⃣ Quantidade de Usos', value: `\`${usos}\``, inline: true },
                        { name: '📍 Canal do Comando', value: `${interaction.channel}`, inline: true },
                        { name: '📝 Motivo', value: `\`\`\`${motivo}\`\`\``, inline: false },
                        { name: '🔑 Código de Autenticação', value: `\`\`\`${codigoAutenticacao}\`\`\``, inline: false },
                        { name: '🎭 Cargo Vinculado', value: cargo ? `${cargo}` : '`Nenhum`', inline: false },
                        { name: '🔗 Link Utilizado', value: `${invite.url}`, inline: false }
                    )
                    .setFooter({ text: 'SSP • Sistema de Convites' })
                    .setTimestamp();

                await canalLogs.send({ embeds: [embedLog] });
            }

            return await interaction.editReply({ embeds: [embedResposta] });

        } catch (error) {
            console.error('Erro detalhado ao processar solicitação de convite:', error);
            try {
                if (interaction.deferred || interaction.replied) {
                    return await interaction.editReply({
                        content: `❌ Ocorreu um erro ao criar o convite. Verifique se o bot possui a permissão **Criar Convite**.`
                    });
                } else {
                    return await interaction.reply({
                        content: `❌ Ocorreu um erro ao criar o convite. Verifique se o bot possui a permissão **Criar Convite**.`,
                        ephemeral: true
                    });
                }
            } catch (e) {}
        }
    }
};