'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  ListOrdered,
  User,
  Accessibility,
  TrendingUp,
  PlusCircle,
  Plane,
  AlarmClock,
  MessageSquareWarning,
  Bot,
  Gamepad2,
  Ambulance,
  Anchor,
  Apple,
  Plug,
  Waves,
  Landmark,
  Target,
  Package,
  Sparkles,
  Hand,
  ChevronDownCircle,
  ArrowDownCircle,
  ArrowDown,
  Download,
  ArrowLeftCircle,
  ArrowLeft,
  ArrowLeftToLine,
  ArrowUpRight,
  ExternalLink,
  ArrowRightCircle,
  ArrowRight,
  ArrowRightToLine,
  ArrowDownRight,
  CornerDownLeft,
  CornerDownRight,
  ArrowUpCircle,
  ArrowUp,
  ArrowUpToLine,
  MoveHorizontal,
  Maximize2,
  ArrowDownLeft,
  MoveVertical,
  Image as ImageIcon,
  Asterisk,
  Banknote,
  Paperclip,
  Cookie,
  Baby,
  Tag,
  Briefcase,
  CreditCard,
  Smartphone,
  Power,
  Luggage,
  PartyPopper,
  Moon,
  QrCode,
  Construction,
  CircleDot,
  GraduationCap,
  Bath,
  ShowerHead,
  Battery,
  BatteryCharging,
  Zap,
  Bed,
  Bug,
  Wine,
  Beer,
  Bell,
  BellOff,
  VolumeX,
  ShieldCheck,
  Bike,
  Heart,
  Eye,
  Headphones,
  Bluetooth,
  PlaneTakeoff,
  Ship,
  Flame,
  Bone,
  Book,
  Library,
  Bookmark,
  BookmarkCheck,
  Radio,
  Footprints,
  Archive,
  Soup,
  Coffee,
  HeartPulse,
  Brain,
  GitBranch,
  Home,
  PenLine,
  FileText,
  Folder,
  Calendar,
  Clock,
  Compass,
  Sun,
  Cloud,
  Music,
  Video,
  Camera,
  Globe,
  Search,
  Key,
  Lock,
  Settings,
  Flag,
  Shield,
  Star,
  Award,
  Smile,
  Layers,
  Database,
  Code,
  Terminal,
  Send,
  PenTool,
  Shuffle,
  Upload as UploadIcon,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { uploadImage, ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '../lib/media-api';

export interface IconItem {
  id: string;
  name: string;
  component: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  keywords: string[];
}

export const ICON_REGISTRY: IconItem[] = [
  { id: '123', name: '123', component: ListOrdered, keywords: ['numbers', 'order', 'list', '123'] },
  { id: 'person', name: 'Person', component: User, keywords: ['user', 'profile', 'human', 'account'] },
  { id: 'accessibility', name: 'Accessibility', component: Accessibility, keywords: ['person', 'a11y', 'universal'] },
  { id: 'chart', name: 'Chart', component: TrendingUp, keywords: ['growth', 'analytics', 'graph', 'stocks'] },
  { id: 'plus-circle', name: 'Plus Circle', component: PlusCircle, keywords: ['add', 'create', 'new'] },
  { id: 'plane', name: 'Plane', component: Plane, keywords: ['travel', 'flight', 'trip', 'airplane'] },
  { id: 'alarm', name: 'Alarm', component: AlarmClock, keywords: ['clock', 'time', 'wake', 'timer'] },
  { id: 'message-warning', name: 'Message Warning', component: MessageSquareWarning, keywords: ['chat', 'alert', 'notice'] },
  { id: 'alien', name: 'Alien', component: Bot, keywords: ['robot', 'ai', 'ufo', 'space'] },
  { id: 'gamepad', name: 'Gamepad', component: Gamepad2, keywords: ['games', 'play', 'arcade', 'invader'] },
  { id: 'ambulance', name: 'Ambulance', component: Ambulance, keywords: ['hospital', 'emergency', 'medical', 'car'] },
  { id: 'anchor', name: 'Anchor', component: Anchor, keywords: ['sea', 'boat', 'marine', 'harbor'] },
  { id: 'apple', name: 'Apple', component: Apple, keywords: ['fruit', 'food', 'healthy', 'mac'] },
  { id: 'plug', name: 'Plug', component: Plug, keywords: ['power', 'electric', 'connect'] },
  { id: 'waves', name: 'Waves', component: Waves, keywords: ['water', 'ocean', 'sea', 'sound'] },
  { id: 'bridge', name: 'Landmark', component: Landmark, keywords: ['bridge', 'building', 'architecture', 'city'] },
  { id: 'target', name: 'Target', component: Target, keywords: ['goal', 'aim', 'focus', 'bow'] },
  { id: 'package', name: 'Package', component: Package, keywords: ['box', 'delivery', 'cargo', 'product'] },
  { id: 'sparkles', name: 'Sparkles', component: Sparkles, keywords: ['magic', 'ai', 'stars', 'shine'] },
  { id: 'hand', name: 'Hand', component: Hand, keywords: ['palm', 'give', 'stop', 'hold'] },
  { id: 'chevron-down-circle', name: 'Chevron Down Circle', component: ChevronDownCircle, keywords: ['arrow', 'circle', 'expand'] },
  { id: 'arrow-down-circle', name: 'Arrow Down Circle', component: ArrowDownCircle, keywords: ['arrow', 'down', 'circle'] },
  { id: 'arrow-down', name: 'Arrow Down', component: ArrowDown, keywords: ['direction', 'south', 'down'] },
  { id: 'download', name: 'Download', component: Download, keywords: ['save', 'inbox', 'tray', 'file'] },
  { id: 'arrow-left-circle', name: 'Arrow Left Circle', component: ArrowLeftCircle, keywords: ['arrow', 'left', 'back'] },
  { id: 'arrow-left', name: 'Arrow Left', component: ArrowLeft, keywords: ['back', 'previous', 'direction'] },
  { id: 'arrow-left-to-line', name: 'Arrow Bar Left', component: ArrowLeftToLine, keywords: ['back', 'start', 'beginning'] },
  { id: 'arrow-up-right', name: 'Arrow Up Right', component: ArrowUpRight, keywords: ['diagonal', 'external', 'growth'] },
  { id: 'external-link', name: 'External Link', component: ExternalLink, keywords: ['link', 'open', 'url'] },
  { id: 'arrow-right-circle', name: 'Arrow Right Circle', component: ArrowRightCircle, keywords: ['next', 'circle', 'forward'] },
  { id: 'arrow-right', name: 'Arrow Right', component: ArrowRight, keywords: ['forward', 'next', 'direction'] },
  { id: 'arrow-right-to-line', name: 'Arrow Bar Right', component: ArrowRightToLine, keywords: ['forward', 'end'] },
  { id: 'arrow-down-right', name: 'Arrow Down Right', component: ArrowDownRight, keywords: ['diagonal', 'corner'] },
  { id: 'corner-down-left', name: 'Corner Down Left', component: CornerDownLeft, keywords: ['return', 'enter'] },
  { id: 'corner-down-right', name: 'Corner Down Right', component: CornerDownRight, keywords: ['turn', 'corner'] },
  { id: 'arrow-up-circle', name: 'Arrow Up Circle', component: ArrowUpCircle, keywords: ['circle', 'top'] },
  { id: 'arrow-up', name: 'Arrow Up', component: ArrowUp, keywords: ['up', 'north', 'top'] },
  { id: 'arrow-up-to-line', name: 'Arrow Up To Line', component: ArrowUpToLine, keywords: ['top', 'ceiling', 'first'] },
  { id: 'move-horizontal', name: 'Move Horizontal', component: MoveHorizontal, keywords: ['horizontal', 'arrows', 'width'] },
  { id: 'maximize', name: 'Maximize', component: Maximize2, keywords: ['fullscreen', 'expand', 'resize'] },
  { id: 'arrow-down-left', name: 'Arrow Down Left', component: ArrowDownLeft, keywords: ['diagonal'] },
  { id: 'move-vertical', name: 'Move Vertical', component: MoveVertical, keywords: ['vertical', 'arrows', 'height'] },
  { id: 'image', name: 'Picture Frame', component: ImageIcon, keywords: ['photo', 'picture', 'art'] },
  { id: 'asterisk', name: 'Asterisk', component: Asterisk, keywords: ['star', 'bullet', 'symbol'] },
  { id: 'banknote', name: 'Banknote', component: Banknote, keywords: ['money', 'cash', 'dollar', 'payment'] },
  { id: 'paperclip', name: 'Paperclip', component: Paperclip, keywords: ['attachment', 'clip', 'file'] },
  { id: 'cookie', name: 'Cookie', component: Cookie, keywords: ['snack', 'food', 'avocado'] },
  { id: 'baby', name: 'Baby', component: Baby, keywords: ['child', 'kid', 'infant'] },
  { id: 'tag', name: 'Tag', component: Tag, keywords: ['label', 'price', 'category'] },
  { id: 'briefcase', name: 'Backpack', component: Briefcase, keywords: ['bag', 'work', 'job', 'luggage'] },
  { id: 'credit-card', name: 'Credit Card', component: CreditCard, keywords: ['payment', 'visa', 'mastercard'] },
  { id: 'smartphone', name: 'Phone', component: Smartphone, keywords: ['mobile', 'cell', 'call'] },
  { id: 'power', name: 'Power', component: Power, keywords: ['turn on', 'energy', 'plug'] },
  { id: 'luggage', name: 'Luggage', component: Luggage, keywords: ['travel', 'suitcase', 'trip'] },
  { id: 'party-popper', name: 'Balloon Party', component: PartyPopper, keywords: ['celebrate', 'confetti', 'holiday'] },
  { id: 'moon', name: 'Moon', component: Moon, keywords: ['night', 'dark', 'crescent'] },
  { id: 'qr-code', name: 'Barcode QR', component: QrCode, keywords: ['code', 'scan', 'barcode'] },
  { id: 'construction', name: 'Barrier', component: Construction, keywords: ['road', 'warning', 'work'] },
  { id: 'circle-dot', name: 'Ball / Dot', component: CircleDot, keywords: ['circle', 'dot', 'record', 'tennis'] },
  { id: 'graduation-cap', name: 'Cap', component: GraduationCap, keywords: ['student', 'school', 'university', 'study'] },
  { id: 'bath', name: 'Bathtub', component: Bath, keywords: ['water', 'clean', 'shower'] },
  { id: 'shower-head', name: 'Shower', component: ShowerHead, keywords: ['water', 'bath'] },
  { id: 'battery', name: 'Battery', component: Battery, keywords: ['power', 'energy', 'charge'] },
  { id: 'battery-charging', name: 'Battery Charging', component: BatteryCharging, keywords: ['charge', 'energy', 'lightning'] },
  { id: 'zap', name: 'Lightning', component: Zap, keywords: ['electric', 'fast', 'speed', 'energy'] },
  { id: 'bed', name: 'Bed', component: Bed, keywords: ['sleep', 'hotel', 'rest'] },
  { id: 'bug', name: 'Bug', component: Bug, keywords: ['insect', 'virus', 'debug'] },
  { id: 'wine', name: 'Wine', component: Wine, keywords: ['drink', 'alcohol', 'glass'] },
  { id: 'beer', name: 'Beer', component: Beer, keywords: ['drink', 'pub', 'bottle'] },
  { id: 'bell', name: 'Bell', component: Bell, keywords: ['notification', 'alert', 'ring', 'alarm'] },
  { id: 'bell-off', name: 'Bell Off', component: BellOff, keywords: ['mute', 'silent', 'quiet'] },
  { id: 'volume-x', name: 'Mute', component: VolumeX, keywords: ['audio', 'silence', 'sound off'] },
  { id: 'shield-check', name: 'Shield Check', component: ShieldCheck, keywords: ['security', 'verified', 'safe'] },
  { id: 'bike', name: 'Bike', component: Bike, keywords: ['bicycle', 'cycling', 'ride'] },
  { id: 'heart', name: 'Heart', component: Heart, keywords: ['love', 'like', 'favorite'] },
  { id: 'eye', name: 'Eye', component: Eye, keywords: ['vision', 'look', 'binoculars', 'see'] },
  { id: 'headphones', name: 'Headphones', component: Headphones, keywords: ['audio', 'music', 'listen'] },
  { id: 'bluetooth', name: 'Bluetooth', component: Bluetooth, keywords: ['wireless', 'connect'] },
  { id: 'plane-takeoff', name: 'Departure', component: PlaneTakeoff, keywords: ['flight', 'fly', 'plane'] },
  { id: 'ship', name: 'Ship', component: Ship, keywords: ['boat', 'cruise', 'sea'] },
  { id: 'flame', name: 'Flame', component: Flame, keywords: ['fire', 'hot', 'burn', 'bomb'] },
  { id: 'bone', name: 'Bone', component: Bone, keywords: ['dog', 'skeleton'] },
  { id: 'book', name: 'Book', component: Book, keywords: ['read', 'notebook', 'study'] },
  { id: 'library', name: 'Library', component: Library, keywords: ['books', 'archive', 'bookshelf'] },
  { id: 'bookmark', name: 'Bookmark', component: Bookmark, keywords: ['save', 'favorite', 'ribbon'] },
  { id: 'bookmark-check', name: 'Bookmark Check', component: BookmarkCheck, keywords: ['saved', 'done'] },
  { id: 'radio', name: 'Radio', component: Radio, keywords: ['boombox', 'music', 'broadcast'] },
  { id: 'footprints', name: 'Footprints', component: Footprints, keywords: ['shoes', 'steps', 'boot', 'walk'] },
  { id: 'archive', name: 'Archive', component: Archive, keywords: ['box', 'storage', 'cabinet'] },
  { id: 'soup', name: 'Soup Bowl', component: Soup, keywords: ['food', 'hot', 'dinner', 'bowl'] },
  { id: 'coffee', name: 'Coffee', component: Coffee, keywords: ['cafe', 'tea', 'cup', 'mug', 'hot'] },
  { id: 'heart-pulse', name: 'Heart Pulse', component: HeartPulse, keywords: ['health', 'ecg', 'cardio'] },
  { id: 'brain', name: 'Brain', component: Brain, keywords: ['mind', 'think', 'idea', 'head'] },
  { id: 'git-branch', name: 'Branch', component: GitBranch, keywords: ['git', 'code', 'version'] },
  { id: 'home', name: 'Home', component: Home, keywords: ['house', 'dashboard', 'main'] },
  { id: 'pen', name: 'Pen', component: PenLine, keywords: ['write', 'edit', 'article'] },
  { id: 'file', name: 'File', component: FileText, keywords: ['document', 'page', 'doc', 'text'] },
  { id: 'folder', name: 'Folder', component: Folder, keywords: ['directory', 'files'] },
  { id: 'calendar', name: 'Calendar', component: Calendar, keywords: ['date', 'event', 'schedule'] },
  { id: 'clock', name: 'Clock', component: Clock, keywords: ['time', 'watch', 'hour'] },
  { id: 'compass', name: 'Compass', component: Compass, keywords: ['navigation', 'direction', 'explore'] },
  { id: 'sun', name: 'Sun', component: Sun, keywords: ['light', 'day', 'weather'] },
  { id: 'cloud', name: 'Cloud', component: Cloud, keywords: ['weather', 'sky', 'storage'] },
  { id: 'music', name: 'Music', component: Music, keywords: ['song', 'melody', 'audio'] },
  { id: 'video', name: 'Video', component: Video, keywords: ['film', 'movie', 'record'] },
  { id: 'camera', name: 'Camera', component: Camera, keywords: ['photo', 'picture', 'lens'] },
  { id: 'globe', name: 'Globe', component: Globe, keywords: ['earth', 'world', 'internet', 'web'] },
  { id: 'search', name: 'Search', component: Search, keywords: ['find', 'lookup', 'magnifier'] },
  { id: 'key', name: 'Key', component: Key, keywords: ['secret', 'unlock', 'access'] },
  { id: 'lock', name: 'Lock', component: Lock, keywords: ['security', 'protect', 'private'] },
  { id: 'settings', name: 'Settings', component: Settings, keywords: ['gear', 'configure', 'options'] },
  { id: 'flag', name: 'Flag', component: Flag, keywords: ['mark', 'goal', 'country'] },
  { id: 'shield', name: 'Shield', component: Shield, keywords: ['protect', 'guard', 'defense'] },
  { id: 'star', name: 'Star', component: Star, keywords: ['rating', 'favorite', 'sky'] },
  { id: 'award', name: 'Award', component: Award, keywords: ['trophy', 'prize', 'winner'] },
  { id: 'smile', name: 'Smile', component: Smile, keywords: ['happy', 'face', 'emotion'] },
  { id: 'layers', name: 'Layers', component: Layers, keywords: ['stack', 'design', 'levels'] },
  { id: 'database', name: 'Database', component: Database, keywords: ['storage', 'sql', 'data'] },
  { id: 'code', name: 'Code', component: Code, keywords: ['develop', 'program', 'html'] },
  { id: 'terminal', name: 'Terminal', component: Terminal, keywords: ['console', 'shell', 'cli'] },
  { id: 'send', name: 'Send', component: Send, keywords: ['airplane', 'submit', 'message'] },
  { id: 'pen-tool', name: 'Pen Tool', component: PenTool, keywords: ['draw', 'vector', 'design'] },
];

export const EMOJI_CATEGORIES: { name: string; emojis: string[] }[] = [
  {
    name: 'Smileys & People',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
      '😘', '😗', '😋', '😛', '😜', '🤪', '😝', '🤗', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏',
      '😒', '🙄', '😬', '😌', '😔', '😪', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🥵', '🥶', '🥴', '😵',
      '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '😮', '😲', '😳', '🥺', '😦', '😧', '😨',
      '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬',
      '💀', '💩', '🤡', '👻', '👽', '🤖', '👋', '🤚', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘',
      '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '✊', '👊', '👏', '🙌', '👐', '🤲', '🤝', '🙏',
    ],
  },
  {
    name: 'Work, Ideas & Tech',
    emojis: [
      '💡', '🚀', '📝', '🎯', '📚', '💻', '🖥️', '📱', '⌨️', '🖱️', '🖨️', '📁', '📂', '📄', '📃', '📊',
      '📈', '📉', '📌', '📍', '📎', '📏', '📐', '✂️', '🔒', '🔓', '🔑', '🔨', '🛠️', '⚙️', '🧪', '🔬',
      '🔭', '📡', '🛸', '🛰️', '🔥', '✨', '🌟', '⭐', '💫', '💥', '⚡', '🏆', '🥇', '🥈', '🥉', '🏅',
    ],
  },
  {
    name: 'Nature & Food',
    emojis: [
      '🌱', '🌿', '🍀', '🍁', '🍂', '🍃', '🍄', '🌸', '🌺', '🌻', '🌹', '🌷', '🌼', '🐱', '🐶', '🦊',
      '🐻', '🐼', '🐨', '🦁', '🐸', '🐵', '🐔', '🐧', '🐦', '🦅', '🦉', '🐝', '🦋', '☕', '🍵', '🧃',
      '🥤', '🧋', '🍺', '🍻', '🍷', '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑', '🥑', '🍔',
      '🍕', '🌮', '🍣', '🍜', '🍰', '🍦', '🍩', '🍪', '🍫',
    ],
  },
  {
    name: 'Symbols & Hearts',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
      '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '🆔', '⚛️',
      '☀️', '🌙', '⭐', '☁️', '🌧️', '⛈️', '❄️', '🌈', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🎸', '🎮',
    ],
  },
];

export const ICON_COLORS = [
  { id: 'default', label: 'Default', value: 'currentColor', bgClass: 'bg-white/20' },
  { id: 'white', label: 'White', value: '#ffffff', bgClass: 'bg-white' },
  { id: 'red', label: 'Red', value: '#ef4444', bgClass: 'bg-red-500' },
  { id: 'amber', label: 'Amber', value: '#f59e0b', bgClass: 'bg-amber-500' },
  { id: 'emerald', label: 'Emerald', value: '#10b981', bgClass: 'bg-emerald-500' },
  { id: 'sky', label: 'Sky', value: '#0ea5e9', bgClass: 'bg-sky-500' },
  { id: 'violet', label: 'Violet', value: '#8b5cf6', bgClass: 'bg-violet-500' },
  { id: 'rose', label: 'Rose', value: '#f43f5e', bgClass: 'bg-rose-500' },
];

export interface IconPickerProps {
  currentIcon?: string | null;
  onSelect: (icon: string | null) => void;
  onClose?: () => void;
  isDark?: boolean;
  token?: string | null;
}

export function IconPicker({
  currentIcon,
  onSelect,
  onClose,
  isDark = true,
  token,
}: IconPickerProps) {
  const [activeTab, setActiveTab] = useState<'emoji' | 'icons' | 'upload'>('icons');
  const [filter, setFilter] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('currentColor');
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter icons
  const filteredIcons = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return ICON_REGISTRY;
    return ICON_REGISTRY.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.keywords.some((kw) => kw.includes(q))
    );
  }, [filter]);

  // Filter emojis
  const filteredEmojis = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return EMOJI_CATEGORIES;
    return EMOJI_CATEGORIES.map((cat) => ({
      name: cat.name,
      emojis: cat.emojis.filter((e) => e.includes(q) || cat.name.toLowerCase().includes(q)),
    })).filter((cat) => cat.emojis.length > 0);
  }, [filter]);

  // Randomize icon/emoji
  const handleShuffle = () => {
    if (activeTab === 'emoji') {
      const allEmojis = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
      const randomEmoji = allEmojis[Math.floor(Math.random() * allEmojis.length)];
      if (randomEmoji) onSelect(randomEmoji);
    } else {
      const randomItem = ICON_REGISTRY[Math.floor(Math.random() * ICON_REGISTRY.length)];
      if (randomItem) onSelect(randomItem.id);
    }
  };

  // Upload custom icon
  const handleFileUpload = async (file?: File | null) => {
    if (!file) return;
    setUploadError(null);
    setUploadBusy(true);

    try {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        throw new Error('Please select a PNG, JPG, GIF or WebP image.');
      }
      if (file.size > MAX_IMAGE_BYTES) {
        throw new Error('Image must be under 5 MB.');
      }

      // Try uploading to cloud API first
      try {
        const url = await uploadImage(file, token);
        onSelect(url);
        onClose?.();
        return;
      } catch (cloudErr) {
        // Fallback to local Base64 Data URL so user is never blocked
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          if (dataUrl) {
            onSelect(dataUrl);
            onClose?.();
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Upload failed.');
    } finally {
      setUploadBusy(false);
    }
  };

  return (
    <div
      className={cn(
        'w-[340px] sm:w-[380px] max-w-[92vw] rounded-xl shadow-2xl border flex flex-col overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150',
        isDark
          ? 'bg-[#202020] text-[#e0e0e0] border-white/10'
          : 'bg-[#ffffff] text-[#1a1a1a] border-black/10'
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Header Tabs */}
      <div
        className={cn(
          'flex items-center justify-between border-b px-3 pt-2 pb-0',
          isDark ? 'border-white/10' : 'border-black/10'
        )}
      >
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('emoji')}
            className={cn(
              'pb-2 text-xs font-medium cursor-pointer transition-colors relative',
              activeTab === 'emoji'
                ? isDark
                  ? 'text-white border-b-2 border-white'
                  : 'text-black border-b-2 border-black'
                : 'text-gray-400 hover:text-gray-200 border-b-2 border-transparent'
            )}
          >
            Emoji
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('icons')}
            className={cn(
              'pb-2 text-xs font-medium cursor-pointer transition-colors relative',
              activeTab === 'icons'
                ? isDark
                  ? 'text-white border-b-2 border-white'
                  : 'text-black border-b-2 border-black'
                : 'text-gray-400 hover:text-gray-200 border-b-2 border-transparent'
            )}
          >
            Icons
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={cn(
              'pb-2 text-xs font-medium cursor-pointer transition-colors relative',
              activeTab === 'upload'
                ? isDark
                  ? 'text-white border-b-2 border-white'
                  : 'text-black border-b-2 border-black'
                : 'text-gray-400 hover:text-gray-200 border-b-2 border-transparent'
            )}
          >
            Upload
          </button>
        </div>

        {/* Remove button */}
        <button
          type="button"
          onClick={() => {
            onSelect(null);
            onClose?.();
          }}
          className={cn(
            'text-xs pb-2 cursor-pointer transition-colors font-medium',
            isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-600'
          )}
        >
          Remove
        </button>
      </div>

      {/* Main Tab Contents */}
      {activeTab === 'icons' && (
        <div className="p-3 space-y-3">
          {/* Search + Shuffle + Color Tint Bar */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs',
                isDark
                  ? 'bg-black/30 border-white/10 text-white focus-within:border-white/30'
                  : 'bg-black/5 border-black/10 text-black focus-within:border-black/30'
              )}
            >
              <Search className="size-3.5 shrink-0 text-gray-400" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter..."
                className="w-full bg-transparent outline-none placeholder:text-gray-500 text-xs"
                autoFocus
              />
              {filter && (
                <button
                  type="button"
                  onClick={() => setFilter('')}
                  className="p-0.5 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* Random shuffle button */}
            <button
              type="button"
              onClick={handleShuffle}
              title="Random icon"
              className={cn(
                'p-1.5 rounded-lg border transition-colors cursor-pointer',
                isDark
                  ? 'border-white/10 hover:bg-white/10 text-gray-300'
                  : 'border-black/10 hover:bg-black/5 text-gray-700'
              )}
            >
              <Shuffle className="size-3.5" />
            </button>

            {/* Color tint button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorPalette(!showColorPalette)}
                title="Icon color"
                className={cn(
                  'size-7.5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer',
                  isDark ? 'border-white/10 hover:bg-white/10' : 'border-black/10 hover:bg-black/5'
                )}
              >
                <span
                  className="size-3.5 rounded-full border border-black/20 shadow-xs"
                  style={{
                    backgroundColor:
                      selectedColor === 'currentColor'
                        ? isDark
                          ? '#ffffff'
                          : '#000000'
                        : selectedColor,
                  }}
                />
              </button>

              {showColorPalette && (
                <div
                  className={cn(
                    'absolute right-0 top-9 z-30 p-2 rounded-lg shadow-xl border grid grid-cols-4 gap-1.5',
                    isDark ? 'bg-[#2a2a2a] border-white/15' : 'bg-white border-black/15'
                  )}
                >
                  {ICON_COLORS.map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => {
                        setSelectedColor(col.value);
                        setShowColorPalette(false);
                      }}
                      className={cn(
                        'size-5 rounded-full cursor-pointer hover:scale-110 transition-transform flex items-center justify-center',
                        col.bgClass
                      )}
                      title={col.label}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section Heading */}
          <div className="text-[11px] font-semibold text-gray-400 tracking-wide uppercase px-0.5">
            Icons
          </div>

          {/* Icon Grid */}
          <div className="h-[260px] overflow-y-auto pr-1 [scrollbar-width:thin]">
            {filteredIcons.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">No icons found</div>
            ) : (
              <div className="grid grid-cols-8 sm:grid-cols-10 gap-1">
                {filteredIcons.map((item) => {
                  const IconComp = item.component;
                  const isSelected = currentIcon === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelect(item.id);
                        onClose?.();
                      }}
                      title={item.name}
                      className={cn(
                        'size-8 rounded-lg flex items-center justify-center transition-all cursor-pointer group',
                        isSelected
                          ? isDark
                            ? 'bg-white/20 text-white ring-1 ring-white/30 shadow-inner'
                            : 'bg-black/15 text-black ring-1 ring-black/20'
                          : isDark
                            ? 'hover:bg-white/10 text-gray-300 hover:text-white'
                            : 'hover:bg-black/5 text-gray-700 hover:text-black'
                      )}
                    >
                      <IconComp
                        className="size-4 shrink-0 transition-transform group-hover:scale-110"
                        style={{
                          color: selectedColor !== 'currentColor' ? selectedColor : undefined,
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emoji Tab */}
      {activeTab === 'emoji' && (
        <div className="p-3 space-y-3">
          {/* Search + Shuffle */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs',
                isDark
                  ? 'bg-black/30 border-white/10 text-white focus-within:border-white/30'
                  : 'bg-black/5 border-black/10 text-black focus-within:border-black/30'
              )}
            >
              <Search className="size-3.5 shrink-0 text-gray-400" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search emoji..."
                className="w-full bg-transparent outline-none placeholder:text-gray-500 text-xs"
                autoFocus
              />
              {filter && (
                <button
                  type="button"
                  onClick={() => setFilter('')}
                  className="p-0.5 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleShuffle}
              title="Random emoji"
              className={cn(
                'p-1.5 rounded-lg border transition-colors cursor-pointer',
                isDark
                  ? 'border-white/10 hover:bg-white/10 text-gray-300'
                  : 'border-black/10 hover:bg-black/5 text-gray-700'
              )}
            >
              <Shuffle className="size-3.5" />
            </button>
          </div>

          {/* Categorized Emojis */}
          <div className="h-[270px] overflow-y-auto space-y-3 pr-1 [scrollbar-width:thin]">
            {filteredEmojis.map((category) => (
              <div key={category.name} className="space-y-1.5">
                <div className="text-[10px] font-semibold text-gray-400 tracking-wide uppercase px-0.5">
                  {category.name}
                </div>
                <div className="grid grid-cols-8 sm:grid-cols-10 gap-1">
                  {category.emojis.map((emoji) => {
                    const isSelected = currentIcon === emoji;
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          onSelect(emoji);
                          onClose?.();
                        }}
                        className={cn(
                          'size-8 rounded-lg flex items-center justify-center text-lg transition-all cursor-pointer hover:scale-120',
                          isSelected
                            ? isDark
                              ? 'bg-white/20 ring-1 ring-white/30'
                              : 'bg-black/15 ring-1 ring-black/20'
                            : isDark
                              ? 'hover:bg-white/10'
                              : 'hover:bg-black/5'
                        )}
                      >
                        {emoji}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="p-4 space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            className="hidden"
            onChange={(e) => {
              handleFileUpload(e.target.files?.[0]);
              e.target.value = '';
            }}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center',
              isDark
                ? 'border-white/15 hover:border-white/30 hover:bg-white/[0.04]'
                : 'border-black/15 hover:border-black/30 hover:bg-black/[0.03]'
            )}
          >
            {uploadBusy ? (
              <Loader2 className="size-8 animate-spin text-blue-400" />
            ) : (
              <UploadIcon className="size-8 text-gray-400" />
            )}
            <div className="text-xs font-medium">
              {uploadBusy ? 'Uploading...' : 'Choose an image or SVG file'}
            </div>
            <div className="text-[11px] text-gray-500">
              Maximum file size: 5 MB
            </div>
          </div>

          {uploadError && (
            <div className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Global helper to render any page icon (emoji, lucide name, or uploaded image)
 */
export function renderPageIcon(
  icon?: string | null,
  sizeClass = 'size-5',
  color?: string
): React.ReactNode {
  if (!icon) {
    return <FileText className={cn(sizeClass, 'shrink-0')} />;
  }

  // 1. Emoji check: If string is 1 or 2 emoji characters or starts with unicode
  const isEmoji =
    /\p{Extended_Pictographic}/u.test(icon) ||
    icon.length <= 4 && !/^[a-zA-Z0-9_\-:]+$/.test(icon);

  if (isEmoji) {
    return (
      <span className={cn('leading-none select-none inline-flex items-center justify-center', sizeClass)}>
        {icon}
      </span>
    );
  }

  // 2. Image URL / base64 check
  if (
    icon.startsWith('http://') ||
    icon.startsWith('https://') ||
    icon.startsWith('data:image/') ||
    icon.startsWith('/uploads/') ||
    icon.startsWith('/api/')
  ) {
    return (
      <img
        src={icon}
        alt="Page icon"
        className={cn(sizeClass, 'shrink-0 object-cover rounded-md')}
      />
    );
  }

  // 3. Lucide icon registry lookup
  const cleanId = icon.toLowerCase().replace(/^lucide:/, '');
  const matched = ICON_REGISTRY.find(
    (item) => item.id.toLowerCase() === cleanId || item.name.toLowerCase() === cleanId
  );

  if (matched) {
    const Component = matched.component;
    return (
      <Component
        className={cn(sizeClass, 'shrink-0')}
        style={{ color: color || undefined }}
      />
    );
  }

  // 4. Fallbacks
  if (cleanId === 'home') return <Home className={cn(sizeClass, 'shrink-0')} />;
  if (cleanId === 'target') return <Target className={cn(sizeClass, 'shrink-0')} />;
  if (cleanId === 'pen') return <PenLine className={cn(sizeClass, 'shrink-0')} />;
  if (cleanId === 'cap') return <GraduationCap className={cn(sizeClass, 'shrink-0')} />;

  return <FileText className={cn(sizeClass, 'shrink-0')} />;
}
