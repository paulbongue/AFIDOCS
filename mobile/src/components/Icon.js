import React from 'react';
import {
  Search, Home, BookOpen, MessageSquare, Download, Bell, User, Settings,
  FileText, File, ChevronRight, LogOut, ShieldCheck, RefreshCw, Smartphone,
  SquarePen, Send, Paperclip, Smile, Pin, CalendarDays, Megaphone, X, Check,
  CheckCheck, Users, SlidersHorizontal, LayoutGrid, List, GraduationCap,
  FolderDown, Inbox, Plus, Trash2, UserPlus, MessageCircle, ArrowLeft,
  Image as ImageIcon, FileSpreadsheet, Presentation, Eye, EyeOff, Star,
} from 'lucide-react-native';
import { colors } from '../theme';

// Mapping nom sémantique -> icône Lucide (le jeu d'icônes utilisé par la maquette).
const MAP = {
  search: Search,
  home: Home,
  resources: BookOpen,
  book: BookOpen,
  chat: MessageSquare,
  'message-circle': MessageCircle,
  download: Download,
  bell: Bell,
  user: User,
  users: Users,
  settings: Settings,
  file: FileText,
  'file-plain': File,
  pdf: FileText,
  docx: FileText,
  pptx: Presentation,
  xlsx: FileSpreadsheet,
  image: ImageIcon,
  chevron: ChevronRight,
  logout: LogOut,
  shield: ShieldCheck,
  sync: RefreshCw,
  device: Smartphone,
  edit: SquarePen,
  send: Send,
  attach: Paperclip,
  emoji: Smile,
  pin: Pin,
  calendar: CalendarDays,
  megaphone: Megaphone,
  close: X,
  check: Check,
  'check-all': CheckCheck,
  filter: SlidersHorizontal,
  grid: LayoutGrid,
  list: List,
  grad: GraduationCap,
  'folder-down': FolderDown,
  inbox: Inbox,
  plus: Plus,
  trash: Trash2,
  'user-plus': UserPlus,
  back: ArrowLeft,
  eye: Eye,
  'eye-off': EyeOff,
  star: Star,
};

export default function Icon({ name, size = 22, color = colors.text, strokeWidth = 2, fill }) {
  const Cmp = MAP[name] || FileText;
  return <Cmp size={size} color={color} strokeWidth={strokeWidth} fill={fill || 'none'} />;
}
