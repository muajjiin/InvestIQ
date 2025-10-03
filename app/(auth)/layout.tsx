import Link from "next/link";
import Image from "next/image";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="auth-layout">
      {/* Left Section */}
      <section className="auth-left-section scrollbar-hide-default">
        <Link href="/" className="auth-logo">
          <Image
            src="/assets/icons/logo.png"
            alt="InvestIQ"
            width={560}
            height={128}
            className="h-8 w-auto"
          />
        </Link>

        <div className="pb-6 lg:pb-8 flex-1">{children}</div>
      </section>

      {/* Right Section */}
      <section className="auth-right-section">
        <div className="z-10 relative lg:mt-4 lg:mb-16">
          <blockquote className="auth-blockquote">
            “InvestIQ transformed my watchlist into a winning list. The insights
            and alerts are incredibly accurate, giving me the confidence to make
            smarter moves in the market.”
          </blockquote>

          <div className="flex items-center justify-between">
            <div>
              <cite className="auth-testimonial-author">- Zubayer A.</cite>
              <p className="max-md:text-xs text-gray-500">Retail Investor</p>
            </div>

            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Image
                  src="/assets/icons/star.svg"
                  alt="Star"
                  key={star}
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="relative flex-l">
          <Image
            src="/assets/images/1.png"
            alt="Dashboard Preview"
            width={1800}
            height={1350}
            className="auth-dashboard-preview absolute"
          />
        </div>
      </section>
    </main>
  );
};

export default Layout;
