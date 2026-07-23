const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('painel-estagio')
        .setDescription('Envia o painel interativo de avaliação de estágio operacional (EAO).'),

    async execute(interaction) {
        // Opcional: restrição de permissão se necessário
        // if (!interaction.member.permissions.has('Administrator')) {
        //     return await interaction.reply({ content: '❌ Você não tem permissão para usar este comando.', ephemeral: true });
        // }

        const embedPainel = new EmbedBuilder()
            .setTitle('AVALIAÇÃO DE ESTÁGIO DE ADAPTAÇÃO OPERACIONAL (EAO)')
            .setDescription(
                'Prezado policial, este formulário tem como finalidade realizar a avaliação referente ao seu desempenho durante o Estágio de Adaptação Operacional (EAO).\n\n' +
                'A avaliação deverá ser preenchida com responsabilidade e atenção, considerando os aspectos técnicos, disciplinares, operacionais e comportamentais apresentados pelo policial durante o período de estágio.\n\n' +
                'As informações registradas serão encaminhadas para análise da equipe responsável, auxiliando na decisão quanto ao aproveitamento e conclusão do estágio operacional.'
            )
            .setColor('#2B2D31')
            .addFields(
                { 
                    name: '📌 Orientações:', 
                    value: '• Responda todas as perguntas de forma objetiva e verdadeira;\n• Avalie o policial conforme seu desempenho durante as atividades;\n• Utilize critérios de disciplina, postura, comprometimento, conhecimento técnico e atuação operacional.', 
                    inline: false 
                },
                { 
                    name: '⚠️ Atenção:', 
                    value: 'Após o preenchimento, revise as informações antes de enviar. Inicie o formulário abaixo para realizar a avaliação do policial.', 
                    inline: false 
                }
            )
            .setFooter({ text: 'CAEP — Sistema de Ensino e Avaliação' })
            .setTimestamp();

        const botaoIniciar = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_iniciar_avaliacao')
                .setLabel('Iniciar Avaliação')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📋')
        );

        await interaction.reply({
            content: '✅ Painel gerado com sucesso!',
            ephemeral: true
        });

        return await interaction.channel.send({
            embeds: [embedPainel],
            components: [botaoIniciar]
        });
    }
};