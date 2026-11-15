import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-[#DDE4DA] bg-[#F4F7F2] mt-20">
      <div className="max-w-[1280px] mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <p className="font-display text-lg font-semibold text-[#1A241E]">Verdant Bowl</p>
          <p className="mt-2 text-sm text-[#526056] max-w-md leading-relaxed">
            Calorie-calibrated diet salads, cold-pressed dressings, and flexible monthly nutrition
            memberships prepared fresh each morning.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-[#1A241E] tracking-wide mb-3">Explore</p>
          <ul className="space-y-2 text-sm text-[#526056]">
            <li>
              <Link to="/menu" className="hover:text-[#166534] transition-colors">
                Signature Salads
              </Link>
            </li>
            <li>
              <Link to="/builder" className="hover:text-[#166534] transition-colors">
                Custom Salad Builder
              </Link>
            </li>
            <li>
              <Link to="/plans" className="hover:text-[#166534] transition-colors">
                Membership Plans
              </Link>
            </li>
            <li>
              <Link to="/appointments" className="hover:text-[#166534] transition-colors">
                Nutrition Appointments
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-[#166534] transition-colors">
                Member Sign In
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold text-[#1A241E] tracking-wide mb-3">Kitchen Hours</p>
          <p className="text-sm text-[#526056] leading-relaxed">
            Monday – Saturday
            <br />
            7:30 AM – 9:30 PM
            <br />
            Indiranagar, Bengaluru
          </p>
        </div>
      </div>
      <div className="border-t border-[#DDE4DA] py-5 px-6 max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#647469]">
        <span>© {new Date().getFullYear()} Verdant Bowl Kitchens. All rights reserved.</span>
        <span>Fresh Greens · Verified Macros · Daily Delivery</span>
      </div>
    </footer>
  );
}
