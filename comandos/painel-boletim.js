const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const CARGO_PERMITIDO_ID = process.env.CARGO_PERMITIDO_ID || '1502362863149518898';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('painel-boletim')
        .setDescription('Envia o painel oficial para emissão de Boletim Interno da CIA AEP.'),
    async execute(interaction) {
        if (!interaction.member.roles.cache.has(CARGO_PERMITIDO_ID)) {
            return await interaction.reply({
                content: '❌ Você não tem permissão para gerar o painel de boletins.',
                ephemeral: true
            });
        }

        const embedPainel = new EmbedBuilder()
            .setTitle('BOLETIM INTERNO | CIA AEP')
            .setDescription(
                'Este é o painel oficial para emissão de Boletim Interno da CIA AEP.\n\n' +
                'Utilize o botão abaixo para preencher corretamente as quatro partes obrigatórias do Boletim Interno e, em seguida, realizar a emissão oficial no canal interno da Organização Policial Militar.\n\n' +
                'Este procedimento tem como finalidade a formalização de registros internos administrativos, garantindo que todas as informações sejam organizadas de forma padronizada, clara e devidamente estruturada dentro do sistema institucional. O correto preenchimento do boletim é essencial para manter a ordem, a rastreabilidade e a eficiência da comunicação interna entre os setores responsáveis.\n\n' +
                'Antes de prosseguir com a emissão, certifique-se de que todos os campos foram preenchidos corretamente, contendo informações completas e consistentes. O envio de dados incompletos ou incorretos poderá comprometer o registro oficial e gerar a necessidade de reemissão do boletim.\n\n' +
                'Após concluir o preenchimento de todas as etapas do formulário, revise cuidadosamente todas as informações inseridas. Em seguida, confirme a emissão para que o boletim seja automaticamente registrado e publicado no canal interno oficial da Organização Policial Militar.\n\n' +
                'Este sistema foi desenvolvido com o objetivo de padronizar os processos internos, otimizar a gestão de informações e garantir maior organização, segurança e eficiência na comunicação institucional.'
            )
            .setColor('#2B2D31') // Borda cinza neutra
            .setImage('https://media.discordapp.net/attachments/1341433401349247037/1529590645868593193/image.png?ex=6a627dcc&is=6a612c4c&hm=31713e600836a120c28600c0ab25a0fd6d4a09911105a7bddd2a437b683db680&=&format=webp&quality=lossless&width=1860&height=620');

        const botaoEmitir = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_abrir_modal_boletim')
                .setLabel('Emitir Boletim Interno')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📋')
        );

        await interaction.reply({
            content: '✅ Painel gerado com sucesso!',
            ephemeral: true
        });

        await interaction.channel.send({
            embeds: [embedPainel],
            components: [botaoEmitir]
        });
    },
};