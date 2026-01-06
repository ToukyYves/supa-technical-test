import { DashboardLayout } from "@/components/dashboard-layout";

export default function DashLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <DashboardLayout>
                    {children}
                </DashboardLayout>
            </body>
        </html>
    );
}