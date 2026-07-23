require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { 
    Client, 
    GatewayIntentBits, 
    Collection, 
    REST, 
    Routes,
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder, 
    ButtonBuilder,
    ButtonStyle, 
    EmbedBuilder,
    Partials
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember]
});

// Coleções para gerenciar atribuição automática de cargos por convite
client.convitesCargos = new Map();
client.invitesCache = new Map();

// Configuração de IDs
const CARGO_PERMITIDO_ID = process.env.CARGO_PERMITIDO_ID || '1502362863149518898';
const CANAL_LOGS_ID_PADRAO = '1529612706624176292';
const CANAL_BOLETIM_ID_PADRAO = '1502358463630807231';

client.commands = new Collection();
const commandsArray = [];
const commandsPath = path.join(__dirname, 'comandos');

// Carregamento dinâmico dos comandos Slash
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
    console.log(`📢 Canal de Logs Ativo: ${process.env.CANAL_LOGS_CONVITE_ID || process.env.CANAL_LOGS_ID || CANAL_LOGS_ID_PADRAO}`);

    // Mapeia convites existentes em todos os servidores ao iniciar
    client.guilds.cache.forEach(async (guild) => {
        try {
            const firstInvites = await guild.invites.fetch();
            firstInvites.forEach((invite) => {
                client.invitesCache.set(invite.code, invite.uses);
            });
        } catch (err) {
            console.error(`Erro ao carregar convites do servidor ${guild.name}:`, err);
        }
    });

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log('Sincronizando comandos globais com o Discord...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commandsArray }
        );
        console.log('✅ Todos os comandos foram registrados com sucesso!');
    } catch (error) {
        console.error('Erro ao sincronizar comandos:', error);
    }
});

// EVENTO: Atualiza o cache quando um novo convite é criado
client.on('inviteCreate', (invite) => {
    client.invitesCache.set(invite.code, invite.uses);
});

// EVENTO: Atribuição automática de cargo ao entrar por convite específico
client.on('guildMemberAdd', async (member) => {
    try {
        const newInvites = await member.guild.invites.fetch();

        const usedInvite = newInvites.find((inv) => {
            const prevUses = client.invitesCache.get(inv.code) || 0;
            return inv.uses > prevUses;
        });

        if (usedInvite) {
            client.invitesCache.set(usedInvite.code, usedInvite.uses);

            const cargoId = client.convitesCargos.get(usedInvite.code);
            if (cargoId) {
                const cargo = member.guild.roles.cache.get(cargoId);
                if (cargo) {
                    await member.roles.add(cargo);
                    console.log(`✅ Cargo "${cargo.name}" atribuído a ${member.user.tag} via convite.`);
                }
            }
        }
    } catch (err) {
        console.error('Erro ao processar cargo automático no guildMemberAdd:', err);
    }
});

client.on('interactionCreate', async (interaction) => {
    try {
        // 1. AÇÃO DO BOTÃO "SOLICITAR FUNCIONAL" -> Abre o Formulário (Modal)
        if (interaction.isButton() && interaction.customId === 'btn_solicitar_funcional') {
            const modal = new ModalBuilder()
                .setCustomId('modal_solicitacao_funcional')
                .setTitle('Solicitação de Funcional - SSP');

            const inputNome = new TextInputBuilder()
                .setCustomId('campo_nome')
                .setLabel('NOME COMPLETO / GUERRA')
                .setPlaceholder('Ex: SILVA')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const inputRE = new TextInputBuilder()
                .setCustomId('campo_re')
                .setLabel('R.E (REGISTRO ESTATÍSTICO)')
                .setPlaceholder('Ex: 123456-7')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const inputUnidade = new TextInputBuilder()
                .setCustomId('campo_unidade')
                .setLabel('UNIDADE')
                .setPlaceholder('Ex: Companhia de Ações Especiais de Polícia')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const inputGraduacao = new TextInputBuilder()
                .setCustomId('campo_graduacao')
                .setLabel('GRADUAÇÃO / POSTO')
                .setPlaceholder('Ex: Aluno-Soldado, Soldado, Cabo, 3º Sargento...')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const inputCodigo = new TextInputBuilder()
                .setCustomId('campo_codigo_autenticacao')
                .setLabel('CÓDIGO DE AUTENTICAÇÃO')
                .setPlaceholder('Ex: aut-126546')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(inputNome),
                new ActionRowBuilder().addComponents(inputRE),
                new ActionRowBuilder().addComponents(inputUnidade),
                new ActionRowBuilder().addComponents(inputGraduacao),
                new ActionRowBuilder().addComponents(inputCodigo)
            );

            return await interaction.showModal(modal);
        }

        // 2. AÇÃO DO BOTÃO DO PAINEL DE BOLETIM -> Abre o Modal do Boletim Interno
        if (interaction.isButton() && interaction.customId === 'btn_abrir_modal_boletim') {
            const modalBoletim = new ModalBuilder()
                .setCustomId('modal_emitir_boletim')
                .setTitle('Emissão de Boletim Interno - CIA AEP');

            const parte1 = new TextInputBuilder()
                .setCustomId('parte_1')
                .setLabel('1ª PARTE (Serviços / Escalas / Pessoal)')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const parte2 = new TextInputBuilder()
                .setCustomId('parte_2')
                .setLabel('2ª PARTE (Instrução / Operações)')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const parte3 = new TextInputBuilder()
                .setCustomId('parte_3')
                .setLabel('3ª PARTE (Assuntos Gerais / Justiça)')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const parte4 = new TextInputBuilder()
                .setCustomId('parte_4')
                .setLabel('4ª PARTE (Logística / Material / Outros)')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const emitidoPor = new TextInputBuilder()
                .setCustomId('emitido_por')
                .setLabel('EMITIDO POR (Nome / Posto / Graduação)')
                .setPlaceholder('Ex: Cap PM Silva')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modalBoletim.addComponents(
                new ActionRowBuilder().addComponents(parte1),
                new ActionRowBuilder().addComponents(parte2),
                new ActionRowBuilder().addComponents(parte3),
                new ActionRowBuilder().addComponents(parte4),
                new ActionRowBuilder().addComponents(emitidoPor)
            );

            return await interaction.showModal(modalBoletim);
        }

        // 3. AÇÃO DO BOTÃO DO PAINEL DE ESTÁGIO -> Executa o comando de avaliação de estágio
        if (interaction.isButton() && interaction.customId === 'btn_iniciar_avaliacao') {
            const command = client.commands.get('avaliar-estagio');
            if (command) {
                return await command.execute(interaction);
            } else {
                return await interaction.reply({ 
                    content: '❌ O comando de avaliação de estágio não foi encontrado.', 
                    ephemeral: true 
                });
            }
        }

        // 4. AÇÃO DO BOTÃO DO PAINEL DE CONVITE -> Abre Modal para gerar convite via painel
        if (interaction.isButton() && interaction.customId === 'btn_gerar_convite') {
            const modalConvite = new ModalBuilder()
                .setCustomId('modal_gerar_convite_painel')
                .setTitle('Gerar Convite / Autenticação');

            const inputUsos = new TextInputBuilder()
                .setCustomId('input_usos')
                .setLabel('QUANTIDADE DE USOS (Ex: 1)')
                .setPlaceholder('1')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const inputMinutos = new TextInputBuilder()
                .setCustomId('input_minutos')
                .setLabel('DURAÇÃO EM MINUTOS (Ex: 60)')
                .setPlaceholder('60')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const inputMotivo = new TextInputBuilder()
                .setCustomId('input_motivo')
                .setLabel('MOTIVO / NOME DO DESTINATÁRIO')
                .setPlaceholder('Ex: Recrutamento / Soldado Silva')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modalConvite.addComponents(
                new ActionRowBuilder().addComponents(inputUsos),
                new ActionRowBuilder().addComponents(inputMinutos),
                new ActionRowBuilder().addComponents(inputMotivo)
            );

            return await interaction.showModal(modalConvite);
        }

        // 5. PROCESSAMENTO DO MODAL DE CONVITE VIA PAINEL (Criação real do convite)
        if (interaction.isModalSubmit() && interaction.customId === 'modal_gerar_convite_painel') {
            await interaction.deferReply({ ephemeral: true });

            const usosStr = interaction.fields.getTextInputValue('input_usos');
            const minutosStr = interaction.fields.getTextInputValue('input_minutos');
            const motivo = interaction.fields.getTextInputValue('input_motivo');

            const usos = parseInt(usosStr, 10);
            const minutos = parseInt(minutosStr, 10);

            if (isNaN(usos) || isNaN(minutos)) {
                return await interaction.editReply({ content: '❌ Os campos de **usos** e **minutos** precisam conter apenas números inteiros.' });
            }

            try {
                // Criação real do convite no canal atual do Discord
                const invite = await interaction.channel.createInvite({
                    maxUses: usos,
                    maxAge: minutos === 0 ? 0 : minutos * 60,
                    reason: motivo
                });

                const numeroAleatorio = Math.floor(100000 + Math.random() * 900000);
                const codigoAutenticacao = `aut-${numeroAleatorio}`;
                const textoMinutos = minutos === 0 ? 'Permanente' : (minutos === 1 ? '1 minuto' : `${minutos} minutos`);

                const embedResposta = new EmbedBuilder()
                    .setTitle('🔑 CONVITE E CÓDIGO GERADOS (PAINEL)')
                    .setColor('#00FF00')
                    .setDescription('Envie o link do convite e o código de autenticação abaixo para o usuário.')
                    .addFields(
                        { name: '🔗 Link do Convite', value: `${invite.url}`, inline: false },
                        { name: '🔑 Código de Autenticação', value: `\`\`\`${codigoAutenticacao}\`\`\``, inline: false },
                        { name: '⏳ Validade', value: `\`${textoMinutos}\``, inline: true },
                        { name: '👥 Limite de Usos', value: `\`${usos}\``, inline: true },
                        { name: '📝 Motivo', value: `\`${motivo}\``, inline: false }
                    )
                    .setFooter({ text: 'SSP • Sistema Policial' })
                    .setTimestamp();

                const ID_CANAL_LOGS = process.env.CANAL_LOGS_CONVITE_ID || process.env.CANAL_LOGS_ID || CANAL_LOGS_ID_PADRAO;
                let canalLogs = interaction.guild.channels.cache.get(ID_CANAL_LOGS);

                if (!canalLogs && ID_CANAL_LOGS) {
                    canalLogs = await interaction.guild.channels.fetch(ID_CANAL_LOGS).catch(() => null);
                }

                if (canalLogs) {
                    const embedLog = new EmbedBuilder()
                        .setTitle('🎟️ REGISTRO DE CONVITE / AUTENTICAÇÃO (PAINEL)')
                        .setColor('#2F3136')
                        .addFields(
                            { name: '👤 Responsável', value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: false },
                            { name: '1️⃣2️⃣3️⃣4️⃣ Quantidade de Usos', value: `\`${usos}\``, inline: true },
                            { name: '📍 Canal do Comando', value: `${interaction.channel}`, inline: true },
                            { name: '📝 Motivo', value: `\`\`\`${motivo}\`\`\``, inline: false },
                            { name: '🔑 Código de Autenticação', value: `\`\`\`${codigoAutenticacao}\`\`\``, inline: false },
                            { name: '🔗 Link Utilizado', value: `${invite.url}`, inline: false }
                        )
                        .setFooter({ text: 'SSP • Sistema de Convites' })
                        .setTimestamp();

                    await canalLogs.send({ embeds: [embedLog] });
                }

                return await interaction.editReply({ embeds: [embedResposta] });

            } catch (error) {
                console.error('Erro ao gerar convite pelo modal:', error);
                return await interaction.editReply({ content: '❌ Ocorreu um erro ao criar o convite. Verifique se o bot possui a permissão **Criar Convite**.' });
            }
        }

        // 6. RECEBIMENTO DO FORMULÁRIO DE FUNCIONAL E ENVIO PARA O CANAL DE ANÁLISE
        if (interaction.isModalSubmit() && interaction.customId === 'modal_solicitacao_funcional') {
            await interaction.deferReply({ ephemeral: true });

            const nome = interaction.fields.getTextInputValue('campo_nome');
            const re = interaction.fields.getTextInputValue('campo_re');
            const unidade = interaction.fields.getTextInputValue('campo_unidade');
            const graduacao = interaction.fields.getTextInputValue('campo_graduacao');
            const codigo = interaction.fields.getTextInputValue('campo_codigo_autenticacao');

            const urlLogoUnidade = 'https://media.discordapp.net/attachments/1341433401349247037/1529591518359191722/ChatGPT_Image_11_de_jul._de_2026__09_07_19-removebg-preview.png';

            const embedSolicitacao = new EmbedBuilder()
                .setTitle('📋 NOVA SOLICITAÇÃO DE FUNCIONAL')
                .setColor('#FEE75C')
                .setThumbnail(urlLogoUnidade)
                .addFields(
                    { name: '👤 Solicitante (Discord)', value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: false },
                    { name: '🪪 Nome', value: `\`${nome}\``, inline: true },
                    { name: '🔢 R.E.', value: `\`${re}\``, inline: true },
                    { name: '🏢 Unidade', value: `\`${unidade}\``, inline: false },
                    { name: '🎖️ Graduação', value: `\`${graduacao}\``, inline: true },
                    { name: '🔑 Código Apresentado', value: `\`\`\`${codigo}\`\`\``, inline: false },
                    { name: '📌 Status', value: '🟡 **PENDENTE DE ANÁLISE**', inline: false }
                )
                .setFooter({ text: 'SSP • Sistema Policial' })
                .setTimestamp();

            const botoesAvaliador = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`btn_aprovar_funcional_${interaction.user.id}`)
                    .setLabel('Aprovar')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅'),
                new ButtonBuilder()
                    .setCustomId(`btn_reprovar_funcional_${interaction.user.id}`)
                    .setLabel('Reprovar')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('❌')
            );

            const canalIdTarget = process.env.CANAL_FUNCIONAL_ID;
            let canalFuncional = interaction.guild.channels.cache.get(canalIdTarget);

            if (!canalFuncional && canalIdTarget) {
                canalFuncional = await interaction.guild.channels.fetch(canalIdTarget).catch(() => null);
            }
            
            if (canalFuncional) {
                await canalFuncional.send({ embeds: [embedSolicitacao], components: [botoesAvaliador] });
            } else {
                console.error(`⚠️ Canal de solicitações funcionais (${canalIdTarget}) não foi encontrado!`);
            }

            return await interaction.editReply({
                content: '✅ **Solicitação enviada com sucesso!** Aguarde a validação pela administração.'
            });
        }

        // 7. AÇÃO DOS BOTÕES APROVAR E REPROVAR FUNCIONAL
        if (interaction.isButton() && (interaction.customId.startsWith('btn_aprovar_funcional_') || interaction.customId.startsWith('btn_reprovar_funcional_'))) {
            
            if (!interaction.member.roles.cache.has(CARGO_PERMITIDO_ID)) {
                return await interaction.reply({
                    content: '❌ **Acesso Negado!** Você não possui o cargo necessário para gerenciar solicitações de funcional.',
                    ephemeral: true
                });
            }

            const embedOriginal = EmbedBuilder.from(interaction.message.embeds[0]);
            const idSolicitante = interaction.customId.split('_').pop();

            if (interaction.customId.startsWith('btn_aprovar_funcional_')) {
                embedOriginal.setColor('#57F287');
                embedOriginal.spliceFields(-1, 1, { 
                    name: '📌 Status', 
                    value: `✅ **APROVADO** por ${interaction.user}`, 
                    inline: false 
                });

                await interaction.update({ embeds: [embedOriginal], components: [] });

                try {
                    const user = await client.users.fetch(idSolicitante);
                    if (user) await user.send('✅ **Sua Solicitação de Funcional foi APROVADA!**');
                } catch (e) {}

            } else {
                embedOriginal.setColor('#ED4245');
                embedOriginal.spliceFields(-1, 1, { 
                    name: '📌 Status', 
                    value: `❌ **REPROVADO** por ${interaction.user}`, 
                    inline: false 
                });

                await interaction.update({ embeds: [embedOriginal], components: [] });

                try {
                    const user = await client.users.fetch(idSolicitante);
                    if (user) await user.send('❌ **Sua Solicitação de Funcional foi REPROVADA!**');
                } catch (e) {}
            }
            return;
        }

        // 8. RECEBIMENTO DO FORMULÁRIO DE EMISSÃO DE BOLETIM INTERNO
        if (interaction.isModalSubmit() && interaction.customId === 'modal_emitir_boletim') {
            await interaction.deferReply({ ephemeral: true });

            const p1 = interaction.fields.getTextInputValue('parte_1');
            const p2 = interaction.fields.getTextInputValue('parte_2');
            const p3 = interaction.fields.getTextInputValue('parte_3');
            const p4 = interaction.fields.getTextInputValue('parte_4');
            const emitidoPor = interaction.fields.getTextInputValue('emitido_por');

            const embedBoletim = new EmbedBuilder()
                .setTitle('BOLETIM INTERNO | CIA AEP')
                .setColor('#2B2D31')
                .addFields(
                    { name: '📁 1º PARTE:', value: p1, inline: false },
                    { name: '📁 2º PARTE:', value: p2, inline: false },
                    { name: '📁 3º PARTE:', value: p3, inline: false },
                    { name: '📁 4º PARTE:', value: p4, inline: false },
                    { name: '👮 Emitido por:', value: emitidoPor, inline: false }
                )
                .setTimestamp();

            const canalBoletimId = process.env.CANAL_BOLETIM_ID || CANAL_BOLETIM_ID_PADRAO;
            let canalDestino = interaction.guild.channels.cache.get(canalBoletimId);

            if (!canalDestino && canalBoletimId) {
                canalDestino = await interaction.guild.channels.fetch(canalBoletimId).catch(() => null);
            }

            if (canalDestino) {
                await canalDestino.send({ 
                    content: '<@&1525502536990064880>', 
                    embeds: [embedBoletim] 
                });
            } else {
                return await interaction.editReply({ content: '❌ Canal de boletins não encontrado!' });
            }

            return await interaction.editReply({ content: '✅ **Boletim Interno emitido com sucesso!**' });
        }

        // 9. ROTEAMENTO DE COMANDOS SLASH, MENUS E MODAIS
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

        await command.execute(interaction);

    } catch (error) {
        console.error('❌ Erro na execução da interação:', error);
        if (interaction.isRepliable()) {
            const erroMsg = { content: '❌ Ocorreu um erro ao processar essa ação.', ephemeral: true };
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp(erroMsg).catch(() => {});
            } else {
                await interaction.reply(erroMsg).catch(() => {});
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);