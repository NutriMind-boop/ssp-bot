const { 
    SlashCommandBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder, 
    EmbedBuilder 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emitir-boletim')
        .setDescription('Abre o painel para gerar o Boletim Interno da Cia AEP.'),

    async execute(interaction) {
        // Se a interação veio do envio do modal, o index.js vai processar. Aqui tratamos apenas a abertura.
        if (interaction.isModalSubmit()) return;

        // Criação do Modal com os campos exatos das partes do boletim
        const modal = new ModalBuilder()
            .setCustomId('modal_emitir_boletim')
            .setTitle('Emissão de Boletim Interno - Cia AEP');

        const inputParte1 = new TextInputBuilder()
            .setCustomId('parte_1')
            .setLabel('1º PARTE: SERVIÇOS DIÁRIOS')
            .setPlaceholder('Ex: Boletim Interno Nº01/26')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const inputParte2 = new TextInputBuilder()
            .setCustomId('parte_2')
            .setLabel('2º PARTE: INSTRUÇÃO E OPERAÇÕES')
            .setPlaceholder('Ex: Boletim Informativo - Integração')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const inputParte3 = new TextInputBuilder()
            .setCustomId('parte_3')
            .setLabel('3º PARTE: ASSUNTOS GERAIS E ADMIN')
            .setPlaceholder('Ex: Comunico a integração do policial...')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const inputParte4 = new TextInputBuilder()
            .setCustomId('parte_4')
            .setLabel('4º PARTE: JUSTIÇA E DISCIPLINA')
            .setPlaceholder('Ex: Oficia-se, Cumpra-se, Publique-se.')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const inputEmitidoPor = new TextInputBuilder()
            .setCustomId('emitido_por')
            .setLabel('EMITIDO POR (Cargo, Nome e RE)')
            .setPlaceholder('Ex: 2º Tenente PM Eduardo Meirelles | 962')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(inputParte1),
            new ActionRowBuilder().addComponents(inputParte2),
            new ActionRowBuilder().addComponents(inputParte3),
            new ActionRowBuilder().addComponents(inputParte4),
            new ActionRowBuilder().addComponents(inputEmitidoPor)
        );

        return await interaction.showModal(modal);
    }
};