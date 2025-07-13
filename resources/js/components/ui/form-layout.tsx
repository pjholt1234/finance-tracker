import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FormLayoutProps {
    title: string;
    description: string;
    children: ReactNode;
    onSubmit?: (e: React.FormEvent) => void;
}

export const FormLayout = ({ title, description, children, onSubmit }: FormLayoutProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit}>
                    {children}
                </form>
            </CardContent>
        </Card>
    );
}; 