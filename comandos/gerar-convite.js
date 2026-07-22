const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    PermissionFlagsBits 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gerar-convite')
        .setDescription('Gera um convite temporário e um código de autenticação para novo membro.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addIntegerOption(option =>
            option.setName('usos')
                .setDescription('Quantidade máxima de usos do convite')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('minutos')
                .setDescription('Duração do convite em minutos')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo ou nome de quem receberá o convite')
                .setRequired(true)),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const usos = interaction.options.getInteger('usos');
            const minutos = interaction.options.getInteger('minutos');
            const motivo = interaction.options.getString('motivo');

            // Converte minutos para segundos
            const tempoSegundos = minutos * 60;

            // Gera o código de autenticação aleatório
            const numeroAleatorio = Math.floor(100000 + Math.random() * 900000);
            const codigoAutenticacao = `aut-${numeroAleatorio}`;

            // Criar o convite no Discord
            const convite = await interaction.channel.createInvite({
                maxAge: tempoSegundos,
                maxUses: usos,
                unique: true,
                reason: `Convite gerado por ${interaction.user.tag} - Motivo: ${motivo}`
            });

            // Embed com o resultado para a Administração
            const embed = new EmbedBuilder()
                .setTitle('🔑 CONVITE E CÓDIGO GERADOS')
                .setColor('#00FF00')
                .setDescription('Envie as informações abaixo para o usuário que irá solicitar a funcional.')
                .addFields(
                    { name: '🔗 Link de Convite', value: `${convite.url}`, inline: false },
                    { name: '🔑 Código de Autenticação', value: `\`\`\`${codigoAutenticacao}\`\`\``, inline: false },
                    { name: '⏳ Expira em', value: `\`${minutos} minutos\``, inline: true },
                    { name: '👥 Limite de Usos', value: `\`${usos}\``, inline: true },
                    { name: '📝 Motivo', value: `\`${motivo}\``, inline: false }
                )
                .setFooter({ text: 'SSP - Sistema Policial' })
                .setTimestamp();

            return await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erro ao gerar convite:', error);
            return await interaction.editReply({
                content: '❌ Ocorreu um erro ao gerar o convite. Verifique se o bot possui a permissão de **Criar Convite** no canal!',
            });
        }
    }
};