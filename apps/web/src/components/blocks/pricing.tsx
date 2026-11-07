'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Free',
    monthlyPrice: '$0',
    yearlyPrice: '$0',
    description: 'Free forever for individuals',
    features: [
      'Unlimited pages & notes',
      'Hierarchical document tree',
      'Markdown & slash commands',
      'Real-time search & history',
    ],
  },
  {
    name: 'Pro',
    monthlyPrice: '$10',
    yearlyPrice: '$8',
    description: 'For power writers and knowledge workers',
    features: [
      'All Free features and...',
      'Unlimited Kivo AI pair-writing',
      'AI Document auto-generation',
      'Full workspace search & discovery',
      'Priority cloud sync & backup',
    ],
  },
  {
    name: 'Team',
    monthlyPrice: '$18',
    yearlyPrice: '$15',
    description: 'For growing teams and collaborative pods',
    features: [
      'All Pro features and...',
      'Collaborative team workspaces',
      'Shared templates library',
      'Dedicated support',
      'Granular workspace permissions',
    ],
  },
];

export const Pricing = ({ className }: { className?: string }) => {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="pricing" className={cn('py-28 lg:py-32', className)}>
      <div className="container max-w-5xl">
        <div className="space-y-4 text-center">
          <h2 className="text-2xl tracking-tight md:text-4xl lg:text-5xl font-bold">
            Transparent, simple pricing
          </h2>
          <p className="text-muted-foreground mx-auto max-w-xl leading-relaxed text-balance">
            Start for free and experience the fastest, cleanest note-taking workspace. Upgrade whenever you need autonomous AI pair-writing.
          </p>
        </div>

        <div className="mt-8 grid items-start gap-5 text-start md:mt-12 md:grid-cols-3 lg:mt-20">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`${plan.name === 'Pro' ? 'outline-primary origin-top outline-4' : ''}`}
            >
              <CardContent className="flex flex-col gap-7 px-6 py-5">
                <div className="space-y-2">
                  <h3 className="text-foreground font-semibold">{plan.name}</h3>
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-lg font-medium">
                      {isAnnual ? plan.yearlyPrice : plan.monthlyPrice}{' '}
                      {plan.name !== 'Free' && (
                        <span className="text-muted-foreground">
                          per user/
                          {isAnnual ? 'year' : 'month'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {plan.name !== 'Free' ? (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isAnnual}
                      onCheckedChange={() => setIsAnnual(!isAnnual)}
                      aria-label="Toggle annual billing"
                    />
                    <span className="text-sm font-medium">Billed annually</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">{plan.description}</span>
                )}

                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="text-muted-foreground flex items-center gap-1.5">
                      <Check className="size-5 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button className="w-fit" variant={plan.name === 'Pro' ? 'default' : 'outline'} asChild>
                  <Link href="/login">Get started</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
