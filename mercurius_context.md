Contexto do Projeto: Mercurius Hub (Fase 4 Concluída)

Este documento serve como mapa de contexto para ferramentas de IA (Copilot, Cursor, Continue, etc) entenderem a arquitetura atual do projeto antes de gerar novos códigos.

1. Visão Geral e Stack Tecnológica

Nome do Projeto: Mercurius Hub

Objetivo: Uma plataforma SaaS B2C premium para investidores cripto acompanharem portfólios, posições DeFi avançadas e guias de Airdrops.

Stack: React (Vite) + Tailwind CSS + Firebase (Auth + Firestore).

Estilo (UI/UX): Dark mode rigoroso (bg-[#07090C], #111), design minimalista, cantos arredondados, uso intensivo de lucide-react para ícones.

2. Estado Atual da Aplicação (O que já funciona)

A fundação de dados e segurança (Fases 1 a 4) está 100% concluída:

Autenticação: O ficheiro App.jsx atua como Router e ouve o estado (onAuthStateChanged). O Login/Registo real acontece em pages/Auth.jsx.

Banco de Dados (Firestore): Todo o estado abandonou o localStorage e agora vive em coleções atreladas ao UID do usuário:

users/{uid}: Contém o perfil base (ex: tier: "free" | "pro" | "vip" | "admin").

users/{uid}/portfolio: Coleção com as moedas compradas.

users/{uid}/defi: Coleção com as posições DeFi.

users/{uid}/airdrops_progress/{airdropId}: Salva os checks de tarefas.

RBAC (Controle de Acesso):

O hook useUserProfile.js escuta o documento do usuário e devolve o tier.

O DashboardLayout.jsx escuta as regras de negócio globais em settings/permissions no Firebase.

Com base nisso, a Sidebar.jsx desenha cadeados (Locks) e o Dashboard exibe Paywalls (PremiumLockScreen) se o usuário não tiver permissão.

Painel Admin: A rota /admin (renderizada via AdminPanel.jsx) só é acessível por tier === 'admin' e permite mudar os tiers dos usuários e as regras de acesso dos módulos em tempo real.

3. Padrões de Código e Regras (Para a IA do VS Code)

Tailwind FIRST: Não criar ficheiros .css avulsos. Tudo deve ser estilizado via classes Tailwind.

Firebase Realtime: Sempre usar onSnapshot em vez de getDocs para ler dados, para que a interface reaja instantaneamente a mudanças no banco.

Proteção de Rotas: O componente principal (DashboardLayout.jsx) já possui a lógica hasAccess(permKey). Novas rotas devem ser inseridas no fluxo de bloqueio existente.

Tratamento de Erros: Sempre usar blocos try/catch em chamadas assíncronas do Firebase com feedback visual suave (sem usar alert() nativo).

4. O Próximo Passo: Fase 5 (Integração "Smart" Web3)

A próxima sprint focará em eliminar a inserção manual de dados:

Nova Rota de Carteiras: Criar uma interface para o usuário colar seus endereços Web3 (EVM e Solana). Salvar em users/{uid}/wallets.

Integração de APIs: Ler as carteiras registradas e bater em APIs de agregação (ex: Moralis, DeBank ou Zapper) para puxar os saldos reais.

Refatoração do Portfólio: O Portfolio.jsx deverá deixar de perguntar "Quantidade" e "Preço de Compra" e passar a exibir os dados calculados que vêm direto da Blockchain.