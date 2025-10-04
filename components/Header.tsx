import Link from "next/link";
import Image from "next/image";
import NavItems from "./NavItems";
import UserDropdown from "./userDropdown";

const Header = ({ user }: { user: User }) => {
  return (
    <header className="sticky top-0 header">
      <div className="container header-wrapper flex items-center justify-between">
        <Link href="/">
          <Image
            src="/assets/icons/logo.png"
            alt="InvestIQ logo "
            width={120} // reasonable width
            height={40} // reasonable height
            className="h-auto w-auto cursor-pointer"
          />
        </Link>
        <nav className="hidden sm:block">
          <NavItems />
        </nav>
        {/* UserDropdown */}

        <UserDropdown user={user} />
      </div>
    </header>
  );
};

export default Header;
