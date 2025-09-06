'use client';

interface HeaderLink {
    name: string;
    href: string;
};

interface HeaderProps {
    links: HeaderLink[];
};

export const Header = ({ links }: HeaderProps) => {

    return (
        <header className="w-full flex items-center justify-between px-4 py-2 border-b">
            <h1 className="text-4xl">Griddy</h1>
            <nav className="flex items-center gap-5">
                {links.map((link: HeaderLink) => {
                    return (
                        <a key={link.name} className="cursor-pointer" href={link.href}>{link.name}</a>
                    );
                })}
            </nav>
        </header>
    );

};