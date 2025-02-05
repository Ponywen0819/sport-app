import Link from "next/link";

const Header = () => {
  return (
    <header className="border-b border-gray-600 py-4">
      <div className="container mx-auto flex justify-between items-center px-4">
        <Link href="/">
          <h1 className="text-2xl font-bold text-white hover:underline">
            運動應用
          </h1>
        </Link>
        <nav>
          <ul className="flex space-x-4">
            <HeaderLink href="/workouts">鍛煉</HeaderLink>
            <HeaderLink href="/nutrition">營養</HeaderLink>
          </ul>
        </nav>
      </div>
    </header>
  );
};

type HeaderLinkProps = {
  href: string;
  children: React.ReactNode;
};

const HeaderLink = ({ href, children }: HeaderLinkProps) => {
  return (
    <li>
      <Link href={href} className="text-gray-300 hover:text-white">
        {children}
      </Link>
    </li>
  );
};

export default Header;
