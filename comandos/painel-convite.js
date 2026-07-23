const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('painel-convite')
        .setDescription('Envia o painel interativo para geração e controle de ingressos.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const embedPainel = new EmbedBuilder()
            .setTitle('📨 | SISTEMA DE CONTROLE DE INGRESSO')
            .setDescription(
                'Seja bem-vindo ao Sistema Oficial de Convites.\n\n' +
                'Este painel foi desenvolvido com a finalidade de realizar o gerenciamento e controle de acesso de novos integrantes ao servidor, garantindo maior organização, segurança e confiabilidade durante o processo de entrada.\n\n' +
                'O ingresso ao servidor é realizado exclusivamente mediante convite autorizado, sendo necessário possuir um código de autenticação válido para concluir o procedimento de admissão.'
            )
            .setColor('#2B2D31')
            .addFields(
                { 
                    name: '🔰 | ORIENTAÇÕES IMPORTANTES', 
                    value: 'Antes de iniciar o processo, atente-se às seguintes informações:\n\n' +
                           '• O código de convite é individual e deve ser utilizado somente pelo integrante autorizado;\n' +
                           '• Cada código possui quantidade limitada de utilizações e prazo de validade determinado;\n' +
                           '• Convites expirados ou já utilizados não poderão ser reaproveitados;\n' +
                           '• O compartilhamento indevido de códigos poderá ocasionar o cancelamento da autorização concedida;\n' +
                           '• O acesso ao servidor não garante aprovação ou permanência, estando todos os integrantes sujeitos às normas, regulamentos e procedimentos internos estabelecidos.', 
                    inline: false 
                },
                { 
                    name: '📋 | PROCESSO DE ENTRADA', 
                    value: 'Após inserir um código válido, o sistema realizará a verificação automática da autorização e, estando em conformidade, permitirá a continuidade do processo de ingresso.\n\n' +
                           'Durante a permanência no servidor, o integrante deverá manter uma conduta compatível com as diretrizes estabelecidas, respeitando a hierarquia, os procedimentos internos e as determinações administrativas.', 
                    inline: false 
                },
                { 
                    name: '⚠️ | ATENÇÃO', 
                    value: 'O sistema de convites possui controle automático de registros, sendo armazenadas informações referentes à utilização dos códigos para garantir transparência, organização e segurança no gerenciamento de acessos.\n\n' +
                           'Caso possua uma autorização válida, clique no botão abaixo e siga as instruções apresentadas pelo sistema.\n\n' +
                           '🔰 | Utilize o botão abaixo para iniciar seu processo.', 
                    inline: false 
                }
            )
            .setFooter({ text: 'Sistema de Segurança e Recrutamento' })
            .setTimestamp();

        const botaoGerar = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_gerar_convite')
                .setLabel('Gerar Meu Convite')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🔗')
        );

        await interaction.reply({
            content: '✅ Painel gerado com sucesso!',
            ephemeral: true
        });

        return await interaction.channel.send({
            embeds: [embedPainel],
            components: [botaoGerar]
        });
    }
};