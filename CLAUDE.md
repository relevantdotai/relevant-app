# CLAUDE.md

This file provides comprehensive guidance to Claude Code when working with Next.js 15 applications with React 19 and TypeScript.

## Core Development Philosophy

### KISS (Keep It Simple, Stupid)
Simplicity should be a key goal in design. Choose straightforward solutions over complex ones whenever possible. Simple solutions are easier to understand, maintain, and debug.

### YAGNI (You Aren't Gonna Need It)
Avoid building functionality on speculation. Implement features only when they are needed, not when you anticipate they might be useful in the future.

### Design Principles
- **Dependency Inversion**: High-level modules should not depend on low-level modules. Both should depend on abstractions.
- **Open/Closed Principle**: Software entities should be open for extension but closed for modification.
- **Vertical Slice Architecture**: Organize by features, not layers
- **Component-First**: Build with reusable, composable components with single responsibility
- **Fail Fast**: Validate inputs early, throw errors immediately

## 🤖 AI Assistant Guidelines

### Context Awareness
- When implementing features, always check existing patterns first
- Prefer composition over inheritance in all designs
- Use existing utilities before creating new ones
- Check for similar functionality in other domains/features

### Common Pitfalls to Avoid
- Creating duplicate functionality
- Overwriting existing tests
- Modifying core frameworks without explicit instruction
- Adding dependencies without checking existing alternatives

### Workflow Patterns
- Preferably create tests BEFORE implementation (TDD)
- Use "think hard" for architecture decisions
- Break complex tasks into smaller, testable units
- Validate understanding before implementation

### Search Command Requirements
**CRITICAL**: Always use `rg` (ripgrep) instead of traditional `grep` and `find` commands:

```bash
# ❌ Don't use grep
grep -r "pattern" .

# ✅ Use rg instead
rg "pattern"

# ❌ Don't use find with name
find . -name "*.tsx"

# ✅ Use rg with file filtering
rg --files | rg "\.tsx$"
# or
rg --files -g "*.tsx"
```

**Enforcement Rules:**
```
(
    r"^grep\b(?!.*\|)",
    "Use 'rg' (ripgrep) instead of 'grep' for better performance and features",
),
(
    r"^find\s+\S+\s+-name\b",
    "Use 'rg --files | rg pattern' or 'rg --files -g pattern' instead of 'find -name' for better performance",
),
```

## 🧱 Code Structure & Modularity

### File and Component Limits
- **Never create a file longer than 500 lines of code.** If approaching this limit, refactor by splitting into modules or helper files.
- **Components should be under 200 lines** for better maintainability.
- **Functions should be short and focused sub 50 lines** and have a single responsibility.
- **Organize code into clearly separated modules**, grouped by feature or responsibility.

## 🚀 Next.js 15 & React 19 Key Features

### Next.js 15 Core Features
- **Turbopack**: Fast bundler for development (stable)
- **App Router**: File-system based router with layouts and nested routing
- **Server Components**: React Server Components for performance
- **Server Actions**: Type-safe server functions
- **Parallel Routes**: Concurrent rendering of multiple pages
- **Intercepting Routes**: Modal-like experiences

### React 19 Features
- **React Compiler**: Eliminates need for `useMemo`, `useCallback`, and `React.memo`
- **Actions**: Handle async operations with built-in pending states
- **use() API**: Simplified data fetching and context consumption
- **Document Metadata**: Native support for SEO tags
- **Enhanced Suspense**: Better loading states and error boundaries

### TypeScript Integration (MANDATORY)
- **MUST use `ReactElement` instead of `JSX.Element`** for return types
- **MUST import types from 'react'** explicitly
- **NEVER use `JSX.Element` namespace** - use React types directly

```typescript
// ✅ CORRECT: Modern React 19 typing
import { ReactElement } from 'react';

function MyComponent(): ReactElement {
  return <div>Content</div>;
}

// ❌ FORBIDDEN: Legacy JSX namespace
function MyComponent(): JSX.Element {  // Cannot find namespace 'JSX'
  return <div>Content</div>;
}
```

## 🏗️ Project Structure (Current Architecture)

```
/
├── app/                   # Next.js App Router
│   ├── api/               # API routes
│   │   ├── stripe/        # Stripe payment operations
│   │   └── user/          # User management operations
│   ├── auth/              # Authentication routes
│   ├── dashboard/         # Protected dashboard
│   ├── onboarding/        # User onboarding flow
│   ├── profile/           # User profile management
│   ├── [other-routes]/    # Additional app routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── metadata.ts        # SEO metadata configuration
│   └── page.tsx           # Landing page
├── components/            # Shared UI components
│   ├── onboarding/        # Feature-specific components
│   └── [other-components] # Shared components
├── contexts/              # React contexts for state management
├── hooks/                 # Custom React hooks
├── utils/                 # Utility functions and configurations
├── types/                 # TypeScript type definitions
├── config/                # Application configuration
├── supabase/              # Database configuration and migrations
├── PRPs/                  # Project Requirements & Planning
└── public/                # Static assets
```

### Architecture Notes
- **No src/ folder**: Uses Next.js 13+ app directory structure at root
- **Feature Co-location**: Related components grouped by domain (onboarding/, etc.)
- **Context Pattern**: React contexts for global state management  
- **Custom Hooks**: Encapsulated business logic in reusable hooks
- **Utility Organization**: Separated utils/ for shared functions
- **Type Safety**: Comprehensive TypeScript definitions
- **Database Integration**: Supabase with migrations and RLS policies

## 🎯 TypeScript Configuration (STRICT REQUIREMENTS)

### MUST Follow These Compiler Options
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### MANDATORY Type Requirements
- **NEVER use `any` type** - use `unknown` if type is truly unknown
- **MUST have explicit return types** for all functions and components
- **MUST use proper generic constraints** for reusable components
- **MUST use type inference from Zod schemas** using `z.infer<typeof schema>`
- **NEVER use `@ts-ignore`** or `@ts-expect-error` - fix the type issue properly

## 📦 Package Management & Dependencies

### Current Project Dependencies
```json
{
  "dependencies": {
    "next": "15.1.3",
    "react": "^19.0.0", 
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.47.10",
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "stripe": "^17.5.0",
    "@stripe/stripe-js": "^5.5.0",
    "@stripe/mcp": "^0.2.1",
    "lucide-react": "^0.475.0",
    "framer-motion": "^12.4.3",
    "@floating-ui/react": "^0.27.4",
    "@headlessui/react": "^2.2.0",
    "posthog-js": "^1.219.0",
    "@vercel/analytics": "^1.4.1",
    "react-error-boundary": "^5.0.0",
    "react-intersection-observer": "^9.15.1",
    "react-scroll": "^1.9.2",
    "react-icons": "^5.4.0",
    "axios": "^1.7.9",
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@types/stripe": "^8.0.416",
    "@types/lodash": "^4.17.14",
    "@types/react-scroll": "^1.8.10",
    "eslint": "^9",
    "eslint-config-next": "15.1.3",
    "@eslint/eslintrc": "^3",
    "tailwindcss": "^3.4.1",
    "postcss": "^8",
    "@supabase/mcp-server-supabase": "^0.3.4"
  }
}
```

### Key Packages Already Installed
- **UI Framework**: Lucide React icons, Headless UI, Floating UI for tooltips/dropdowns
- **Animations**: Framer Motion for smooth animations and transitions
- **Stripe Integration**: Full Stripe ecosystem including MCP server
- **Analytics**: PostHog for user analytics, Vercel Analytics  
- **Error Handling**: React Error Boundary for graceful error recovery
- **Utilities**: Lodash, Axios for HTTP requests

### Recommended Additional Dependencies
```bash
# Form Handling and Validation (if needed)
npm install react-hook-form @hookform/resolvers zod

# State Management (if global state needed beyond contexts)
npm install @tanstack/react-query zustand

# Development Tools (testing not yet configured)
npm install -D @testing-library/react @testing-library/jest-dom vitest jsdom

# UI Enhancements (if needed)
npm install class-variance-authority clsx tailwind-merge
```

## 🔐 Authentication & Database Setup (Supabase Social Auth)

### Environment Variables (MANDATORY VALIDATION)
```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  
  // Supabase Configuration (Only these two are needed!)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export const env = envSchema.parse(process.env);
```

### Supabase Client Configuration
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/lib/env';

export const createClient = () =>
  createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
```

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

export const createClient = () => {
  const cookieStore = cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server component - ignore
          }
        },
      },
    }
  );
};
```

### Auth Middleware
```typescript
// lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshing the auth token
  await supabase.auth.getUser();

  return supabaseResponse;
}
```

### Next.js Middleware
```typescript
// middleware.ts
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### Auth Callback Route
```typescript
// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
```

### Social Authentication Hooks
```typescript
// hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === 'SIGNED_IN') {
          router.push('/dashboard');
        } else if (event === 'SIGNED_OUT') {
          router.push('/');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);

  const signInWithProvider = async (provider: 'github' | 'google') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    if (error) {
      console.error('Error signing in:', error.message);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
      throw error;
    }
  };

  return {
    user,
    loading,
    signInWithProvider,
    signOut,
    isAuthenticated: !!user,
  };
}
```

### Database Types Generation
```typescript
// lib/supabase/types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Generate by running: npx supabase gen types typescript --local > lib/supabase/types.ts
```

## 🎨 Icon Usage with Lucide React (MANDATORY)

### Icon Import Pattern (MUST FOLLOW)
```typescript
// ✅ CORRECT: Named imports only
import { User, Mail, Lock, Github, Chrome } from 'lucide-react';

// ❌ FORBIDDEN: Default imports
import Lucide from 'lucide-react';
```

### Icon Component Pattern
```typescript
/**
 * Standardized icon component with consistent sizing and styling.
 * 
 * @component
 * @example
 * ```tsx
 * <Icon 
 *   icon={User} 
 *   size="md" 
 *   className="text-blue-500" 
 * />
 * ```
 */
interface IconProps {
  /** Lucide icon component */
  icon: LucideIcon;
  
  /** Predefined size variants @default 'md' */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  /** Additional CSS classes */
  className?: string;
  
  /** ARIA label for accessibility */
  'aria-label'?: string;
}

const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export const Icon = ({ 
  icon: IconComponent, 
  size = 'md', 
  className,
  'aria-label': ariaLabel,
  ...props 
}: IconProps): ReactElement => {
  return (
    <IconComponent
      size={iconSizes[size]}
      className={cn('flex-shrink-0', className)}
      aria-label={ariaLabel}
      {...props}
    />
  );
};
```

### Common Icon Usage Examples
```typescript
// Authentication Icons
import { Github, Chrome as Google, Mail, Lock, Eye, EyeOff } from 'lucide-react';

// Navigation Icons  
import { Home, Settings, User, Bell, Search, Menu, X } from 'lucide-react';

// Action Icons
import { Plus, Edit, Trash2, Save, Download, Upload, Share } from 'lucide-react';

// Status Icons
import { Check, AlertCircle, Info, AlertTriangle, Loader2 } from 'lucide-react';

// Usage in components
function SignInForm(): ReactElement {
  return (
    <div>
      <Button>
        <Icon icon={Github} size="sm" />
        Sign in with GitHub
      </Button>
      
      <Button>
        <Icon icon={Google} size="sm" />
        Sign in with Google
      </Button>
    </div>
  );
}
```

## 🛡️ Data Validation with Zod (MANDATORY FOR ALL EXTERNAL DATA)

### MUST Follow These Validation Rules
- **MUST validate ALL external data**: API responses, form inputs, URL params, environment variables
- **MUST use branded types**: For all IDs and domain-specific values
- **MUST fail fast**: Validate at system boundaries, throw errors immediately
- **MUST use type inference**: Always derive TypeScript types from Zod schemas

### Schema Example (MANDATORY PATTERNS)
```typescript
import { z } from 'zod';

// MUST use branded types for ALL IDs
const UserIdSchema = z.string().uuid().brand<'UserId'>();
type UserId = z.infer<typeof UserIdSchema>;

// Authentication schemas
export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type SignInData = z.infer<typeof signInSchema>;
export type SignUpData = z.infer<typeof signUpSchema>;

// Supabase user schema
export const supabaseUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  created_at: z.string().datetime(),
  user_metadata: z.object({
    avatar_url: z.string().url().optional(),
    full_name: z.string().optional(),
    provider: z.enum(['github', 'google']),
  }),
});

// API response validation
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    error: z.string().optional(),
    timestamp: z.string().datetime(),
  });
```

### Social Auth Component Example
```typescript
import { useAuth } from '@/hooks/useAuth';
import { Github, Chrome, Loader2 } from 'lucide-react';
import { useState } from 'react';

function SocialAuthButtons(): ReactElement {
  const { signInWithProvider } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleProviderSignIn = async (provider: 'github' | 'google') => {
    try {
      setLoading(provider);
      await signInWithProvider(provider);
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => handleProviderSignIn('github')}
        disabled={loading !== null}
        className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors disabled:opacity-50"
      >
        {loading === 'github' ? (
          <Icon icon={Loader2} size="sm" className="animate-spin" />
        ) : (
          <Icon icon={Github} size="sm" />
        )}
        Continue with GitHub
      </button>
      
      <button
        onClick={() => handleProviderSignIn('google')}
        disabled={loading !== null}
        className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-white hover:bg-gray-50 text-gray-900 border rounded-lg transition-colors disabled:opacity-50"
      >
        {loading === 'google' ? (
          <Icon icon={Loader2} size="sm" className="animate-spin" />
        ) : (
          <Icon icon={Chrome} size="sm" />
        )}
        Continue with Google
      </button>
    </div>
  );
}
```

## 🧪 Testing Strategy (MANDATORY REQUIREMENTS)

### MUST Meet These Testing Standards
- **MINIMUM 80% code coverage** - NO EXCEPTIONS
- **MUST co-locate tests** with components in `__tests__` folders
- **MUST use React Testing Library** for all component tests
- **MUST test user behavior** not implementation details
- **MUST mock external dependencies** appropriately
- **MUST test authentication flows** with mocked Supabase

### Test Configuration (Vitest + React Testing Library)
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

### Auth Testing Example
```typescript
/**
 * @fileoverview Tests for SocialAuthButtons component
 * @module components/__tests__/SocialAuthButtons.test
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '@testing-library/react';
import { SocialAuthButtons } from '../SocialAuthButtons';

// Mock Supabase
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithOAuth: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      getUser: vi.fn(() => ({ data: { user: null } })),
    },
  })),
}));

/**
 * Test suite for SocialAuthButtons component.
 * 
 * Tests user interactions and social authentication flow.
 * Mocks Supabase client to ensure isolated unit tests.
 */
describe('SocialAuthButtons', () => {
  /**
   * Tests GitHub OAuth initiation.
   */
  it('should initiate GitHub OAuth when clicked', async () => {
    const user = userEvent.setup();
    
    render(<SocialAuthButtons />);
    
    const githubButton = screen.getByRole('button', { name: /continue with github/i });
    await user.click(githubButton);
    
    // Verify loading state appears
    expect(screen.getByText(/continue with github/i)).toBeInTheDocument();
  });

  /**
   * Tests Google OAuth initiation.
   */
  it('should initiate Google OAuth when clicked', async () => {
    const user = userEvent.setup();
    
    render(<SocialAuthButtons />);
    
    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    await user.click(googleButton);
    
    expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
  });
});
```

## 🎨 Component Guidelines (STRICT REQUIREMENTS)

### MANDATORY Component Documentation

```typescript
/**
 * Authentication button with provider-specific styling and icons.
 * 
 * Provides OAuth login functionality with GitHub and Google providers using Supabase.
 * Uses Lucide icons and follows design system patterns.
 * 
 * @component
 * @example
 * ```tsx
 * <AuthButton 
 *   provider="github" 
 *   onClick={handleGitHubSignIn}
 * >
 *   Sign in with GitHub
 * </AuthButton>
 * ```
 */
interface AuthButtonProps {
  /** OAuth provider type */
  provider: 'github' | 'google';
  
  /** Click handler for authentication */
  onClick: (provider: string) => Promise<void>;
  
  /** Button content */
  children: React.ReactNode;
  
  /** Whether the button is in loading state @default false */
  isLoading?: boolean;
  
  /** Whether the button is disabled @default false */
  disabled?: boolean;
}

const providerConfig = {
  github: {
    icon: Github,
    bgColor: 'bg-gray-900 hover:bg-gray-800',
    textColor: 'text-white',
  },
  google: {
    icon: Chrome,
    bgColor: 'bg-white hover:bg-gray-50 border',
    textColor: 'text-gray-900',
  },
} as const;

const AuthButton = React.forwardRef<HTMLButtonElement, AuthButtonProps>(
  ({ provider, onClick, children, isLoading = false, disabled = false }, ref) => {
    const config = providerConfig[provider];
    
    return (
      <button
        ref={ref}
        onClick={() => onClick(provider)}
        disabled={disabled || isLoading}
        className={cn(
          'flex items-center justify-center gap-3 w-full px-4 py-3 rounded-lg transition-colors',
          config.bgColor,
          config.textColor,
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <Icon icon={Loader2} size="sm" className="animate-spin" />
        ) : (
          <Icon icon={config.icon} size="sm" />
        )}
        {children}
      </button>
    );
  }
);
AuthButton.displayName = 'AuthButton';
```

## 🔄 State Management (STRICT HIERARCHY)

### MUST Follow This State Hierarchy
1. **Local State**: `useState` ONLY for component-specific state
2. **Context**: For cross-component state within a single feature
3. **URL State**: MUST use search params for shareable state
4. **Server State**: MUST use TanStack Query for ALL API data
5. **Global State**: Zustand ONLY when truly needed app-wide
6. **Auth State**: Supabase auth state management

### Server State Pattern (TanStack Query with Supabase)
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

function useUser(id: UserId) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        throw new Error(`Failed to fetch user: ${error.message}`);
      }
      
      return supabaseUserSchema.parse(data);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
}

function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('profiles')
        .update(userData)
        .eq('id', userData.id)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to update user: ${error.message}`);
      }
      
      return supabaseUserSchema.parse(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user', data.id] });
    },
  });
}
```

## 🔐 Security Requirements (MANDATORY)

### Input Validation (MUST IMPLEMENT ALL)
- **MUST sanitize ALL user inputs** with Zod before processing
- **MUST validate file uploads**: type, size, and content
- **MUST prevent XSS** with proper escaping
- **MUST implement CSRF protection** for forms
- **NEVER use dangerouslySetInnerHTML** without sanitization
- **MUST validate Supabase RLS policies** for all data access

### Row Level Security (RLS) Example
```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (after auth)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### Database Trigger for User Profiles
```sql
-- Function to handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## 🚀 Performance Guidelines

### Next.js 15 Optimizations
- **Use Server Components** by default for data fetching
- **Client Components** only when necessary (interactivity)
- **Dynamic imports** for large client components
- **Image optimization** with next/image
- **Font optimization** with next/font
- **Supabase Edge Functions** for server-side operations

### Bundle Optimization
```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      // Turbopack configuration
    },
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  // Bundle analyzer
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks.chunks = 'all';
    }
    return config;
  },
};

module.exports = nextConfig;
```

## 💅 Code Style & Quality

### ESLint Configuration (MANDATORY)
```javascript
// eslint.config.js
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "error",
      "no-console": ["error", { "allow": ["warn", "error"] }],
      "react/function-component-definition": ["error", {
        "namedComponents": "arrow-function"
      }],
    },
  },
];

export default eslintConfig;
```

## 📋 Development Commands

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint --max-warnings 0",
    "lint:fix": "next lint --fix",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "validate": "npm run type-check && npm run lint && npm run test:coverage",
    "supabase:gen-types": "npx supabase gen types typescript --local > src/lib/supabase/types.ts",
    "db:reset": "npx supabase db reset",
    "db:migrate": "npx supabase migration up",
    "db:seed": "npx supabase db seed"
  }
}
```

## ⚠️ CRITICAL GUIDELINES (MUST FOLLOW ALL)

1. **ENFORCE strict TypeScript** - ZERO compromises on type safety
2. **VALIDATE everything with Zod** - ALL external data must be validated
3. **MINIMUM 80% test coverage** - NO EXCEPTIONS
4. **MUST co-locate related files** - Tests MUST be in `__tests__` folders
5. **MAXIMUM 500 lines per file** - Split if larger
6. **MAXIMUM 200 lines per component** - Refactor if larger
7. **MUST handle ALL states** - Loading, error, empty, and success
8. **MUST use semantic commits** - feat:, fix:, docs:, refactor:, test:
9. **MUST write complete JSDoc** - ALL exports must be documented
10. **NEVER use `any` type** - Use proper typing or `unknown`
11. **MUST pass ALL automated checks** - Before ANY merge
12. **MUST use Lucide React icons** - Named imports only
13. **MUST implement RLS policies** - For all Supabase tables
14. **MUST test auth flows** - With proper mocking

## 📋 Pre-commit Checklist (MUST COMPLETE ALL)

- [ ] TypeScript compiles with ZERO errors (`npm run type-check`)
- [ ] Tests written and passing with 80%+ coverage (`npm run test:coverage`)
- [ ] ESLint passes with ZERO warnings (`npm run lint`)
- [ ] Prettier formatting applied (`npm run format`)
- [ ] All components have complete JSDoc documentation
- [ ] Zod schemas validate ALL external data
- [ ] ALL states handled (loading, error, empty, success)
- [ ] Error boundaries implemented for features
- [ ] Accessibility requirements met (ARIA labels, keyboard nav)
- [ ] No console.log statements in production code
- [ ] Environment variables validated with Zod
- [ ] Component files under 200 lines
- [ ] No prop drilling beyond 2 levels
- [ ] Server/Client components used appropriately
- [ ] Lucide icons used with proper naming
- [ ] Supabase RLS policies tested
- [ ] Auth flows tested with proper session handling
- [ ] Database migrations run successfully

### FORBIDDEN Practices
- **NEVER use `any` type** (except library declaration merging with comments)
- **NEVER skip tests** for new functionality
- **NEVER ignore TypeScript errors** with `@ts-ignore`
- **NEVER trust external data** without Zod validation
- **NEVER use `JSX.Element`** - use `ReactElement` instead
- **NEVER store sensitive data** in localStorage or client state
- **NEVER use dangerouslySetInnerHTML** without sanitization
- **NEVER exceed file/component size limits**
- **NEVER prop drill** beyond 2 levels - use context or state management
- **NEVER commit** without passing all quality checks
- **NEVER use default imports** from lucide-react
- **NEVER skip RLS policies** on Supabase tables
- **NEVER hardcode secrets** in client-side code
- **NEVER use direct Supabase client** without proper error handling

---

*This guide is optimized for Next.js 15 with React 19, Supabase Social Auth, and Lucide React.*
*Focus on type safety, performance, maintainability, and security in all development decisions.*
*Last updated: January 2025*