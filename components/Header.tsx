import Link from "next/link"
import Image from "next/image"
import NavItems from "./NavItems"
import UserDropdown from "./userDropdown"

const Header = () => {
  return (
    <header className="stick top=0 header">
      <div className="container header-wrapper">
        <Link href='/'>
          <Image src="/assets/icons/logo.png" alt='Signalist Logo' width={540} height={132} className="h-8 w-auto cursor-pointer" />
        </Link>
        <nav className="hidden sm:block"  >
          <NavItems />
        </nav>
        {/* UserDromdown */}
        <UserDropdown />
      </div>
    </header>
  )
}

export default Header
