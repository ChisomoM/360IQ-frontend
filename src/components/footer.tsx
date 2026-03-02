import { Facebook, MessageCircle, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#1e3c21] text-white relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#febb00]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Logo & About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#febb00] to-[#febb00]/80 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-[#1e3c21] font-bold">UoL</span>
              </div>
              <div>
                <div className="text-white font-bold">UNILUS</div>
                <div className="text-xs text-white/70">University of Lusaka</div>
              </div>
            </div>
            <p className="text-white/80 text-sm leading-relaxed">
              Excellence in higher education, empowering future leaders through quality academic programs and student development.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white mb-4 font-bold">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="#about" className="text-white/80 hover:text-[#febb00] transition-colors text-sm">
                  About UoL
                </a>
              </li>
              <li>
                <a href="#programs" className="text-white/80 hover:text-[#febb00] transition-colors text-sm">
                  Academic Programs
                </a>
              </li>
              <li>
                <a href="#admissions" className="text-white/80 hover:text-[#febb00] transition-colors text-sm">
                  Admissions
                </a>
              </li>
              <li>
                <a href="#contact" className="text-white/80 hover:text-[#febb00] transition-colors text-sm">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white mb-4 font-bold">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-white/80 hover:text-[#febb00] transition-colors text-sm">
                  Student Portal
                </a>
              </li>
              <li>
                <a href="#" className="text-white/80 hover:text-[#febb00] transition-colors text-sm">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#news" className="text-white/80 hover:text-[#febb00] transition-colors text-sm">
                  News & Events
                </a>
              </li>
              <li>
                <a href="#" className="text-white/80 hover:text-[#febb00] transition-colors text-sm">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="text-white mb-4 font-bold">Connect With Us</h4>
            <div className="flex gap-3 mb-4">
              <a 
                href="#" 
                title="Facebook"
                className="w-11 h-11 bg-white/10 hover:bg-[#febb00] backdrop-blur-sm rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                title="WhatsApp"
                className="w-11 h-11 bg-white/10 hover:bg-[#febb00] backdrop-blur-sm rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                title="Twitter"
                className="w-11 h-11 bg-white/10 hover:bg-[#febb00] backdrop-blur-sm rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
            <p className="text-white/80 text-sm">
              Follow us for updates and announcements
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 mt-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/70">
            <p>© 2025 University of Lusaka. All Rights Reserved.</p>
            <p>
              Designed & Developed by <span className="text-[#febb00]">Chisomo Mutale</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
