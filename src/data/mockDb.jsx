// src/data/mockDb.jsx
import React from 'react';
import { 
  Droplet, ArrowRightLeft, Image as ImageIcon, Code, 
  Trophy, Layers, Clock, RefreshCcw, Database 
} from 'lucide-react';

export const tutorialStepsRobinhood = [
  {
    id: 'phase1',
    title: 'Fase 1: Preparação e Faucets (Tokens de Teste)',
    description: 'O primeiro passo é obter fundos na rede de testes para pagar pelas taxas de transação (gas).',
    icon: <Droplet className="w-5 h-5" />,
    tasks: [
      {
        id: 't1_1',
        title: 'Fazer Bridge de Sepolia para Robinhood',
        desc: 'Transfira seu $ETH de teste da rede Sepolia para a Robinhood Testnet usando a ponte da Arbitrum.',
        link: 'https://portal.arbitrum.io/bridge',
        subLinks: [{ name: 'Minerador de Sepolia', url: 'https://sepolia-faucet.pk910.de/' }],
      },
      {
        id: 't1_2',
        title: 'Reivindicar Tokens no Faucet Oficial',
        desc: 'Acesse o faucet oficial da Robinhood para solicitar seus primeiros tokens de teste nativos.',
        link: 'https://faucet.testnet.chain.robinhood.com',
      },
      {
        id: 't1_3',
        title: 'Reivindicar no OmniHub Faucet',
        desc: 'Obtenha fundos adicionais para garantir que não faltará gas durante as interações.',
        link: 'https://omnihub.xyz/faucet',
      },
    ],
  },
  {
    id: 'phase2',
    title: 'Fase 2: Interações DeFi',
    description: 'Interaja com protocolos de Finanças Descentralizadas para gerar volume e histórico de transações.',
    icon: <ArrowRightLeft className="w-5 h-5" />,
    tasks: [
      {
        id: 't2_1',
        title: 'Edel Finance - Lending & Borrowing',
        desc: 'Conecte sua carteira. Vá na aba "Faucet" e pegue os tokens. Na plataforma, forneça liquidez (Supply), pegue um empréstimo (Borrow) e depois pague-o (Repay).',
        link: 'https://robinhood.edel.finance',
      },
      {
        id: 't2_2',
        title: 'Synthra - Swap e Liquidez',
        desc: 'Faça swaps (trocas) entre diferentes tokens de teste e adicione liquidez nos pools disponíveis na rede Robinhood.',
        link: 'https://app.synthra.org/#/swap?chain=robinhood',
      },
    ],
  },
  {
    id: 'phase3',
    title: 'Fase 3: Implantação e Cunhagem de NFTs',
    description: 'Crie seus próprios contratos e cunhe NFTs de diferentes projetos parceiros na testnet.',
    icon: <ImageIcon className="w-5 h-5" />,
    tasks: [
      {
        id: 't3_1',
        title: 'Implantar seu próprio NFT no NFTs2Me',
        desc: 'Crie e faça o deploy (implantação) de uma coleção própria de NFTs de forma simplificada.',
        link: 'https://nfts2me.com/app/robinhood-testnet/',
      },
      {
        id: 't3_2',
        title: 'Criar Contrato no OmniHub',
        desc: 'Utilize a ferramenta do OmniHub para fazer o deploy de um contrato inteligente básico na rede.',
        link: 'https://omnihub.xyz/create/robinhood-testnet',
      },
      {
        id: 't3_3',
        title: 'Mintar NFTs Promocionais (Diversos)',
        desc: 'Acesse os links abaixo e cunhe (mint) os NFTs promocionais disponíveis na testnet:',
        subLinks: [
          { name: 'Omnihub NFT', url: 'https://omnihub.xyz/collection/robinhood-testnet/robinhood-omnihub' },
          { name: 'Mintaura Daydream', url: 'https://mintaura.io/daydream' },
          { name: 'Mintaura Marian', url: 'https://mintaura.io/marian' },
          { name: 'Morkie Robinson', url: 'https://morkie.xyz/robinson' },
          { name: 'Morkie Archer', url: 'https://morkie.xyz/archer' },
          { name: 'Oku Skateboard', url: 'https://oku.xyz/skateboard' },
          { name: 'Draze Robinhood', url: 'https://draze.io/robinhood' },
          { name: 'Draze Barbaros', url: 'https://draze.io/barbaros' },
        ],
      },
    ],
  },
  {
    id: 'phase4',
    title: 'Fase 4: Contratos Inteligentes',
    description: 'Atividades avançadas que aumentam muito a qualidade da sua carteira perante o airdrop.',
    icon: <Code className="w-5 h-5" />,
    tasks: [
      {
        id: 't4_1',
        title: 'Implantar via OnchainGM',
        desc: 'Uma alternativa fácil para fazer o deploy de um contrato diretamente pelo navegador.',
        link: 'https://onchaingm.com/deploy',
      },
      {
        id: 't4_2',
        title: 'Enviar GM e Mintar Badge',
        desc: 'Interaja com o protocolo OnchainGM enviando um "GM" e mintando o Badge exclusivo.',
        subLinks: [
          { name: 'Enviar GM', url: 'https://onchaingm.com/?ref=0x9aC26D73B0a6dB219DD61a660C5e7Ce94f6796db' },
          { name: 'Mintar Badge', url: 'https://onchaingm.com/badge-robinhood' },
        ],
      },
    ],
  },
  {
    id: 'phase5',
    title: 'Fase 5: Campanhas e Rastreamento',
    description: 'Finalize validando suas ações nas plataformas de quests e confira seu histórico.',
    icon: <Trophy className="w-5 h-5" />,
    tasks: [
      {
        id: 't5_1',
        title: 'Campanha Superboard',
        desc: 'Complete as quests listadas na Superboard para registrar sua participação oficial.',
        link: 'https://superboard.xyz/campaigns/robinhood-testnet-exploration',
      },
      {
        id: 't5_2',
        title: 'Verificar no Explorer',
        desc: 'Cole o endereço da sua carteira no Explorer oficial para acompanhar todas as transações realizadas.',
        link: 'https://explorer.testnet.chain.robinhood.com',
      },
    ],
  },
];

export const AIRDROPS_DB = [
  {
    id: 'robinhood',
    name: 'Robinhood',
    type: 'Testnet',
    cost: '$0',
    time: '15 Mins',
    accent: '#D2FF00',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=600',
    description: 'Posicione-se para o potencial airdrop da Robinhood interagindo com a testnet pública e utilizando o ecossistema DeFi inicial.',
    videoUrl: 'https://www.youtube.com/embed/fIjr8iVmsyg',
    layout: 'standard',
    steps: tutorialStepsRobinhood,
  },
  {
    id: 'scroll',
    name: 'Scroll',
    type: 'Mainnet',
    cost: '$15 - $30',
    time: '25 Mins',
    accent: '#FFF0B3',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f4ec651?auto=format&fit=crop&q=80&w=600',
    description: 'Guia completo para interagir com o ecossistema Scroll na Mainnet e farmar volume focado na Perpdex.',
    layout: 'custom',
    steps: [],
  },
];

export const SUPPORTED_COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', color: '#F7931A' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', color: '#627EEA' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', color: '#14F195' },
  { id: 'tether', symbol: 'USDT', name: 'Tether USD', color: '#26A17B' },
  { id: 'usd-coin', symbol: 'USDC', name: 'USDC', color: '#2775CA' },
];

export const DEFI_TYPES = [
  { id: 'staking', label: 'Staking', icon: Layers, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { id: 'lending', label: 'Lending', icon: ArrowRightLeft, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { id: 'pool', label: 'Pool de Liquidez (CLP)', icon: Droplet, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  { id: 'pendle', label: 'Pendle PT', icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { id: 'looping', label: 'Looping', icon: RefreshCcw, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  { id: 'vault', label: 'Yield Vault', icon: Database, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
];