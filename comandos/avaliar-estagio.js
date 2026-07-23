const { 
    SlashCommandBuilder, 
    ActionRowBuilder, 
    UserSelectMenuBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    EmbedBuilder 
} = require('discord.js');

let contadorRegistro = 1;

function gerarBarraProgresso(nota) {
    const totalBlocos = 10;
    const blocosCheios = Math.min(Math.max(Math.round(nota), 0), totalBlocos);
    const blocosVazios = totalBlocos - blocosCheios;
    const barra = '█'.repeat(blocosCheios) + '░'.repeat(blocosVazios);
    return `${barra} ${nota}/10`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avaliar-estagio')
        .setDescription('Inicia a avaliação de estágio operacional.'),

    async execute(interaction) {
        // 1. Comando /avaliar-estagio ou Clique no Botão do Painel -> Abre menu
        if (interaction.isChatInputCommand() || (interaction.isButton() && interaction.customId === 'btn_iniciar_avaliacao')) {
            const selectMenu = new UserSelectMenuBuilder()
                .setCustomId('selecionar_policial')
                .setPlaceholder('Selecione o policial a ser avaliado...')
                .setMinValues(1)
                .setMaxValues(1);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            return await interaction.reply({
                content: '📋 **Avaliação de Estágio:** Selecione o policial que você deseja avaliar:',
                components: [row],
                ephemeral: true
            });
        }

        // 2. Seleção de membro no menu -> Abre Formulário Modal
        if (interaction.isUserSelectMenu() && interaction.customId === 'selecionar_policial') {
            const modal = new ModalBuilder()
                .setCustomId(`modal_avaliacao_${interaction.values[0]}`)
                .setTitle('Avaliação de Estágio Operacional');

            const inputAvaliador = new TextInputBuilder()
                .setCustomId('avaliador_info')
                .setLabel('Nome completo e R.E (Mín. 3º Sgt PM)')
                .setPlaceholder('Ex: 3º Sgt PM João Oliveira - RE 123456-7')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const inputComportamento = new TextInputBuilder()
                .setCustomId('nota_comportamento')
                .setLabel('Comportamento Policial (Nota de 1 a 10)')
                .setPlaceholder('Digite apenas um número de 1 a 10 (ex: 9)')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(2)
                .setRequired(true);

            const inputConduta = new TextInputBuilder()
                .setCustomId('nota_conduta')
                .setLabel('Conduta e Disciplina Policial (1 a 10)')
                .setPlaceholder('Digite apenas um número de 1 a 10 (ex: 10)')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(2)
                .setRequired(true);

            const inputOperacional = new TextInputBuilder()
                .setCustomId('nota_operacional')
                .setLabel('Serviço Operacional (1 a 10)')
                .setPlaceholder('Digite apenas um número de 1 a 10 (ex: 8)')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(2)
                .setRequired(true);

            const inputObs = new TextInputBuilder()
                .setCustomId('observacoes')
                .setLabel('Observações Positivas e Negativas')
                .setPlaceholder('Resuma os pontos fortes e o que precisa ser aperfeiçoado...')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(inputAvaliador),
                new ActionRowBuilder().addComponents(inputComportamento),
                new ActionRowBuilder().addComponents(inputConduta),
                new ActionRowBuilder().addComponents(inputOperacional),
                new ActionRowBuilder().addComponents(inputObs)
            );

            return await interaction.showModal(modal);
        }

        // 3. Envio do Formulário -> Cálculo de média e postagem no canal
        if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_avaliacao_')) {
            // Adia a resposta imediatamente para evitar o estouro dos 3 segundos do Discord
            await interaction.deferReply({ ephemeral: true });

            const targetUserId = interaction.customId.split('_')[2];
            const targetUser = await interaction.client.users.fetch(targetUserId).catch(() => null);

            const avaliadorInfo = interaction.fields.getTextInputValue('avaliador_info');
            const notaComportamento = parseFloat(interaction.fields.getTextInputValue('nota_comportamento').replace(',', '.')) || 0;
            const notaConduta = parseFloat(interaction.fields.getTextInputValue('nota_conduta').replace(',', '.')) || 0;
            const notaOperacional = parseFloat(interaction.fields.getTextInputValue('nota_operacional').replace(',', '.')) || 0;
            const observacoes = interaction.fields.getTextInputValue('observacoes');

            if (
                isNaN(notaComportamento) || notaComportamento < 0 || notaComportamento > 10 ||
                isNaN(notaConduta) || notaConduta < 0 || notaConduta > 10 ||
                isNaN(notaOperacional) || notaOperacional < 0 || notaOperacional > 10
            ) {
                return await interaction.editReply({
                    content: '❌ **Erro:** As notas devem ser números válidos entre 1 e 10.'
                });
            }

            const mediaCalculada = (notaComportamento + notaConduta + notaOperacional) / 3;
            const mediaFormatada = mediaCalculada.toFixed(1).replace('.', ',');
            
            const foiAprovado = mediaCalculada >= 7.0;
            const resultadoTexto = foiAprovado ? '🟢 APROVADO' : '🔴 REPROVADO';
            const corEmbed = foiAprovado ? 0x2ECC71 : 0xE74C3C;

            const idRegistro = `#AE-${String(contadorRegistro).padStart(4, '0')}`;
            contadorRegistro++;

            const agora = new Date();
            const dataFormatada = agora.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
            const horaFormatada = agora.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });

            const embed = new EmbedBuilder()
                .setTitle('═══════════════════════════════\n       AVALIAÇÃO DE ESTÁGIO\n═══════════════════════════════')
                .setColor(corEmbed)
                .addFields(
                    { name: '👤 POLICIAL AVALIADO', value: `<@${targetUserId}>\n*${targetUser ? targetUser.username : 'Desconhecido'}*`, inline: false },
                    { name: '👮 POLICIAL AVALIADOR', value: avaliadorInfo, inline: false },
                    { name: '────────────────────', value: '\u200B', inline: false },
                    { name: '📌 Comportamento Policial', value: gerarBarraProgresso(notaComportamento), inline: false },
                    { name: '📌 Conduta e Disciplina Policial', value: gerarBarraProgresso(notaConduta), inline: false },
                    { name: '📌 Serviço Operacional', value: gerarBarraProgresso(notaOperacional), inline: false },
                    { name: '────────────────────', value: '\u200B', inline: false },
                    { name: '📝 OBSERVAÇÕES', value: observacoes, inline: false },
                    { name: '────────────────────', value: '\u200B', inline: false },
                    { name: '📊 MÉDIA FINAL', value: `**${mediaFormatada} / 10**`, inline: true },
                    { name: '📋 RESULTADO', value: `**${resultadoTexto}**`, inline: true },
                    { name: '────────────────────', value: '\u200B', inline: false },
                    { name: '🆔 REGISTRO DA AVALIAÇÃO', value: `**${idRegistro}**`, inline: true },
                    { name: '📅 DATA E HORÁRIO', value: `${dataFormatada} às ${horaFormatada}`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'CAEP — Centro de Aperfeiçoamento e Ensino Policial' });

            const canalDestinoId = process.env.CANAL_AVALIACOES_ID;
            let canalDestino = interaction.guild.channels.cache.get(canalDestinoId);

            if (!canalDestino && canalDestinoId) {
                canalDestino = await interaction.guild.channels.fetch(canalDestinoId).catch(() => null);
            }

            if (!canalDestino) {
                return await interaction.editReply({
                    content: '❌ **Erro:** Não foi possível encontrar o canal de avaliações. Verifique o ID no arquivo .env.'
                });
            }

            await canalDestino.send({ embeds: [embed] });

            return await interaction.editReply({ 
                content: `✅ Avaliação **${idRegistro}** enviada com sucesso para o canal <#${canalDestinoId}>!` 
            });
        }
    }
};