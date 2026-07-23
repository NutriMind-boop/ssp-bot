const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    PermissionFlagsBits 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('painel-funcional')
        .setDescription('Envia o painel de solicitação funcional no canal atual.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        try {
            // Link direto do banner do Discord (corrigido)
            const urlBannerBaixo = 'https://media.discordapp.net/attachments/1341433401349247037/1529590645868593193/image.png?ex=6a627dcc&is=6a612c4c&hm=31713e600836a120c28600c0ab25a0fd6d4a09911105a7bddd2a437b683db680&=&format=webp&quality=lossless&width=1860&height=620';

            // 1. Criando a Embed do Painel
            const embed = new EmbedBuilder()
                .setTitle('CAEP — PAINEL DE SOLICITAÇÃO FUNCIONAL')
                .setColor('#FF0000') // Linha lateral vermelha
                .setDescription(
                    'Este painel destina-se exclusivamente ao processamento de solicitações de identificação funcional.\n\n' +
                    'O solicitante deverá preencher corretamente todos os campos exigidos, sob responsabilidade das informações fornecidas, para análise e validação do pedido pelo setor competente.\n\n' +
                    'O link de convite encaminhado contém um código de autenticação na parte inferior.\n' +
                    'É obrigatório copiar este código e inseri-lo no campo correspondente durante o preenchimento da solicitação funcional.\n\n' +
                    'Solicitações com dados incompletos, inconsistentes ou divergentes estarão sujeitas à recusa imediata.'
                )
                .setImage(urlBannerBaixo)
                .setFooter({ text: 'SSP • Sistema Policial', iconURL: interaction.guild.iconURL() });

            // 2. Criando o Botão Vermelho "Solicitar Funcional"
            const botao = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('btn_solicitar_funcional')
                    .setLabel('Solicitar Funcional')
                    .setEmoji('📄')
                    .setStyle(ButtonStyle.Danger) // Cor vermelha
            );

            // Envia o painel direto no canal de forma fixa
            await interaction.channel.send({ embeds: [embed], components: [botao] });

            // Responde para o administrador de forma invisível que deu certo
            return await interaction.reply({
                content: '✅ Painel de Solicitação Funcional enviado com sucesso!',
                ephemeral: true
            });

        } catch (error) {
            console.error('Erro ao enviar o painel:', error);
            return await interaction.reply({
                content: '❌ Ocorreu um erro ao enviar o painel!',
                ephemeral: true
            });
        }
    }
};