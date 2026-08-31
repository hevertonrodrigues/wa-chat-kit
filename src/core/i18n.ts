// Every user-facing string in the kit, overridable per instance. pt-BR is the
// source of truth; en and es ship as built-ins so hosts without an i18n layer
// still get complete UIs.

export type ChatLabels = {
  conversationsTitle: string;
  searchPlaceholder: string;
  emptyList: string;
  emptyThread: string;
  selectConversation: string;
  loadOlder: string;
  startOfConversation: string;
  today: string;
  yesterday: string;
  you: string;
  composerPlaceholder: string;
  send: string;
  attach: string;
  recordAudio: string;
  stopRecording: string;
  cancelRecording: string;
  micDenied: string;
  replyingTo: string;
  cancelReply: string;
  reply: string;
  react: string;
  copy: string;
  download: string;
  retry: string;
  sessionClosed: string;
  sessionClosedHint: string;
  statusSending: string;
  statusSent: string;
  statusDelivered: string;
  statusRead: string;
  statusFailed: string;
  mediaPending: string;
  mediaFailed: string;
  mediaExpired: string;
  viewLocation: string;
  contactCard: string;
  templateBadge: string;
  interactiveBadge: string;
  unsupported: string;
  scrollToBottom: string;
  newMessages: string;
  previewImage: string;
  previewVideo: string;
  previewAudio: string;
  previewDocument: string;
  previewSticker: string;
  previewLocation: string;
  previewContacts: string;
  previewTemplate: string;
  previewInteractive: string;
  previewReaction: string;
  previewUnsupported: string;
};

export const ptBR: ChatLabels = {
  conversationsTitle: 'Conversas',
  searchPlaceholder: 'Buscar conversas…',
  emptyList: 'Nenhuma conversa ainda.',
  emptyThread: 'Nenhuma mensagem nesta conversa.',
  selectConversation: 'Selecione uma conversa para começar.',
  loadOlder: 'Carregar mensagens anteriores',
  startOfConversation: 'Início da conversa',
  today: 'Hoje',
  yesterday: 'Ontem',
  you: 'Você',
  composerPlaceholder: 'Escreva uma mensagem…',
  send: 'Enviar',
  attach: 'Anexar arquivo',
  recordAudio: 'Gravar áudio',
  stopRecording: 'Concluir gravação',
  cancelRecording: 'Descartar gravação',
  micDenied: 'Sem acesso ao microfone — verifique as permissões do navegador.',
  replyingTo: 'Respondendo a',
  cancelReply: 'Cancelar resposta',
  reply: 'Responder',
  react: 'Reagir',
  copy: 'Copiar',
  download: 'Baixar',
  retry: 'Tentar de novo',
  sessionClosed: 'Janela de 24h fechada',
  sessionClosedHint: 'Envie um template aprovado para reabrir a conversa.',
  statusSending: 'Enviando',
  statusSent: 'Enviada',
  statusDelivered: 'Entregue',
  statusRead: 'Lida',
  statusFailed: 'Falhou',
  mediaPending: 'Carregando mídia…',
  mediaFailed: 'Mídia indisponível',
  mediaExpired: 'Mídia expirada no WhatsApp',
  viewLocation: 'Ver no mapa',
  contactCard: 'Contato',
  templateBadge: 'Template',
  interactiveBadge: 'Interativa',
  unsupported: 'Mensagem não suportada',
  scrollToBottom: 'Ir para o fim',
  newMessages: 'Novas mensagens',
  previewImage: '📷 Foto',
  previewVideo: '🎬 Vídeo',
  previewAudio: '🎤 Áudio',
  previewDocument: '📄 Documento',
  previewSticker: '💟 Figurinha',
  previewLocation: '📍 Localização',
  previewContacts: '👤 Contato',
  previewTemplate: '📋 Template',
  previewInteractive: '☑️ Interativa',
  previewReaction: 'Reagiu a uma mensagem',
  previewUnsupported: 'Mensagem não suportada',
};

export const en: ChatLabels = {
  conversationsTitle: 'Conversations',
  searchPlaceholder: 'Search conversations…',
  emptyList: 'No conversations yet.',
  emptyThread: 'No messages in this conversation.',
  selectConversation: 'Select a conversation to get started.',
  loadOlder: 'Load older messages',
  startOfConversation: 'Start of conversation',
  today: 'Today',
  yesterday: 'Yesterday',
  you: 'You',
  composerPlaceholder: 'Type a message…',
  send: 'Send',
  attach: 'Attach file',
  recordAudio: 'Record audio',
  stopRecording: 'Finish recording',
  cancelRecording: 'Discard recording',
  micDenied: 'Microphone unavailable — check browser permissions.',
  replyingTo: 'Replying to',
  cancelReply: 'Cancel reply',
  reply: 'Reply',
  react: 'React',
  copy: 'Copy',
  download: 'Download',
  retry: 'Retry',
  sessionClosed: '24h window closed',
  sessionClosedHint: 'Send an approved template to reopen the conversation.',
  statusSending: 'Sending',
  statusSent: 'Sent',
  statusDelivered: 'Delivered',
  statusRead: 'Read',
  statusFailed: 'Failed',
  mediaPending: 'Loading media…',
  mediaFailed: 'Media unavailable',
  mediaExpired: 'Media expired on WhatsApp',
  viewLocation: 'View on map',
  contactCard: 'Contact',
  templateBadge: 'Template',
  interactiveBadge: 'Interactive',
  unsupported: 'Unsupported message',
  scrollToBottom: 'Jump to latest',
  newMessages: 'New messages',
  previewImage: '📷 Photo',
  previewVideo: '🎬 Video',
  previewAudio: '🎤 Audio',
  previewDocument: '📄 Document',
  previewSticker: '💟 Sticker',
  previewLocation: '📍 Location',
  previewContacts: '👤 Contact',
  previewTemplate: '📋 Template',
  previewInteractive: '☑️ Interactive',
  previewReaction: 'Reacted to a message',
  previewUnsupported: 'Unsupported message',
};

export const es: ChatLabels = {
  conversationsTitle: 'Conversaciones',
  searchPlaceholder: 'Buscar conversaciones…',
  emptyList: 'Aún no hay conversaciones.',
  emptyThread: 'No hay mensajes en esta conversación.',
  selectConversation: 'Selecciona una conversación para empezar.',
  loadOlder: 'Cargar mensajes anteriores',
  startOfConversation: 'Inicio de la conversación',
  today: 'Hoy',
  yesterday: 'Ayer',
  you: 'Tú',
  composerPlaceholder: 'Escribe un mensaje…',
  send: 'Enviar',
  attach: 'Adjuntar archivo',
  recordAudio: 'Grabar audio',
  stopRecording: 'Terminar grabación',
  cancelRecording: 'Descartar grabación',
  micDenied: 'Micrófono no disponible — revisa los permisos del navegador.',
  replyingTo: 'Respondiendo a',
  cancelReply: 'Cancelar respuesta',
  reply: 'Responder',
  react: 'Reaccionar',
  copy: 'Copiar',
  download: 'Descargar',
  retry: 'Reintentar',
  sessionClosed: 'Ventana de 24h cerrada',
  sessionClosedHint: 'Envía un template aprobado para reabrir la conversación.',
  statusSending: 'Enviando',
  statusSent: 'Enviado',
  statusDelivered: 'Entregado',
  statusRead: 'Leído',
  statusFailed: 'Falló',
  mediaPending: 'Cargando archivo…',
  mediaFailed: 'Archivo no disponible',
  mediaExpired: 'Archivo expirado en WhatsApp',
  viewLocation: 'Ver en el mapa',
  contactCard: 'Contacto',
  templateBadge: 'Template',
  interactiveBadge: 'Interactiva',
  unsupported: 'Mensaje no soportado',
  scrollToBottom: 'Ir al final',
  newMessages: 'Mensajes nuevos',
  previewImage: '📷 Foto',
  previewVideo: '🎬 Video',
  previewAudio: '🎤 Audio',
  previewDocument: '📄 Documento',
  previewSticker: '💟 Sticker',
  previewLocation: '📍 Ubicación',
  previewContacts: '👤 Contacto',
  previewTemplate: '📋 Template',
  previewInteractive: '☑️ Interactiva',
  previewReaction: 'Reaccionó a un mensaje',
  previewUnsupported: 'Mensaje no soportado',
};

export const builtinLabels: Record<'pt-BR' | 'en' | 'es', ChatLabels> = {
  'pt-BR': ptBR,
  en,
  es,
};

export function resolveLabels(
  locale: string | undefined,
  overrides?: Partial<ChatLabels>,
): ChatLabels {
  const base =
    builtinLabels[(locale ?? 'pt-BR') as keyof typeof builtinLabels] ??
    (locale?.startsWith('es') ? es : locale?.startsWith('en') ? en : ptBR);
  return overrides ? { ...base, ...overrides } : base;
}

export function previewLabelFor(
  labels: ChatLabels,
  type: string | null | undefined,
  fallbackText?: string | null,
): string {
  switch (type) {
    case 'image':
      return labels.previewImage;
    case 'video':
      return labels.previewVideo;
    case 'audio':
      return labels.previewAudio;
    case 'document':
      return labels.previewDocument;
    case 'sticker':
      return labels.previewSticker;
    case 'location':
      return labels.previewLocation;
    case 'contacts':
      return labels.previewContacts;
    case 'template':
      return labels.previewTemplate;
    case 'interactive':
    case 'button':
      return fallbackText || labels.previewInteractive;
    case 'reaction':
      return labels.previewReaction;
    case 'unsupported':
    case 'unknown':
      return labels.previewUnsupported;
    default:
      return fallbackText ?? '';
  }
}
