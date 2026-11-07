import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, FileText, FolderTree, Search } from 'lucide-react';

import { DashedLine } from '@/components/dashed-line';
import { Button } from '@/components/ui/button';

const features = [
  {
    title: 'Distraction-free Writing',
    description: 'A clean, typography-first document editor built for focus.',
    icon: FileText,
  },
  {
    title: 'Hierarchical Notes',
    description: 'Organize pages and infinite sub-pages in an intuitive tree.',
    icon: FolderTree,
  },
  {
    title: 'Kivo AI Pair-Writer',
    description: 'Create, edit, polish, and search documents with Gemini AI.',
    icon: Sparkles,
  },
  {
    title: 'Instant Fast Search',
    description: 'Find any page or keyword across your workspace in milliseconds.',
    icon: Search,
  },
];

export const Hero = () => {
  return (
    <section className="py-28 lg:py-32 lg:pt-44">
      <div className="container flex flex-col justify-between gap-8 md:gap-14 lg:flex-row lg:gap-20">
        {/* Left side - Main content */}
        <div className="flex-1">
          <h1 className="text-foreground max-w-160 text-3xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            The Minimalist Workspace for Notes, Docs & AI
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl mt-5 leading-relaxed max-w-xl">
            Kivo brings together distraction-free writing, hierarchical notes, and autonomous AI pair-writing inside a beautifully fast, modern workspace.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4 lg:flex-nowrap">
            <Button size="lg" asChild>
              <Link href="/login">Get Started Free</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 shadow-xs"
              asChild
            >
              <Link href="/#features">
                Explore Features
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Right side - Features */}
        <div className="relative flex flex-1 flex-col justify-center space-y-5 max-lg:pt-10 lg:pl-10">
          <DashedLine orientation="vertical" className="absolute top-0 left-0 max-lg:hidden" />
          <DashedLine orientation="horizontal" className="absolute top-0 lg:hidden" />
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="flex gap-2.5 lg:gap-5">
                <Icon className="text-foreground mt-1 size-4 shrink-0 lg:size-5" />
                <div>
                  <h2 className="font-text text-foreground font-semibold">{feature.title}</h2>
                  <p className="text-muted-foreground max-w-76 text-sm">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-12 max-lg:ml-6 max-lg:h-[550px] max-lg:overflow-hidden md:mt-20 lg:container lg:mt-24">
        <div className="relative h-[793px] w-full">
          <Image
            src="/hero.webp"
            alt="hero"
            fill
            className="rounded-2xl object-cover object-left-top shadow-lg max-lg:rounded-tr-none"
          />
        </div>
      </div>
    </section>
  );
};
