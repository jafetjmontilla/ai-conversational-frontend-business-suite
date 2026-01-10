'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ArrowLeft, Search } from 'lucide-react';
import Image from 'next/image';

export default function NotFound() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-wellness-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-24 h-24 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <Search className="w-12 h-12 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <CardTitle className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              404
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              Página no encontrada
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver atrás
            </Button>

            <Button
              onClick={handleGoHome}
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Ir al Dashboard
            </Button>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Image
                src="/images/4netBlancoGradient.png"
                alt="Logo"
                width={48}
                height={28}
                className="rounded"
              />
              <span>ERP</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
