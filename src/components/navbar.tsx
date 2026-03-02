import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
// import type { hr } from "date-fns/locale";

export default function Navbar(){
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    
    const navItems = [
        {name: 'Home', href: '/'},
        {name: 'Apply Now', href: '/join'},
        {name: 'Programmes', href: '/'},
        {name: 'Fees & Tuition', href: '/'},


        // {name: 'ECOS', href: '/ecos'},
        // {name: 'Membership', href: '/join'},
        // {name: 'Contact', href: '/contact'},
    ];

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 10) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Active state highlighting can be added later (e.g., via IntersectionObserver)

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault();
        if (href.startsWith('/')) {
            navigate(href);
        } else {
            // Handle ID selectors (with or without #)
            const selector = href.startsWith('#') ? href : `#${href}`;
            const element = document.querySelector(selector);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
        setIsOpen(false);
    };

    const navigate = useNavigate();
    // const onGetStarted = () => navigate("/login")

    return (
        <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`fixed w-full top-0 z-50 transition-all duration-300 ${
                isScrolled ? "bg-white shadow-md py-2" : "bg-transparent py-4"
            }`}
        >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 overflow-visible">
                    {/* Logo */}
                    <a href="/" className="flex-shrink-0 justify-start grid grid-cols-2">
                        <img
                            src={isScrolled ? "/logos/unilus-logo-3.png" : "/logos/unilus-logo-3.png"}
                            alt="University of Lusaka Logo"
                            className="h-32 w-auto object-contain"
                        />
                    </a>

                    {/* Desktop Navigation */}
                    <nav className="hidden  md:flex items-center space-x-8">
                        {navItems.map((item) => (
                            <a 
                                key={item.name}
                                href={item.href}
                                className={`px-3 py-2 text-sm font-medium transition-colors duration-200 hover:text-primary-gold ${
                                    isScrolled ? "text-gray-800" : "text-white"
                                }`}
                                onClick={(e) => handleNavClick(e, item.href)}
                            >
                                {item.name}
                            </a>
                        ))}
                        
                        
                    </nav>

                    <Button 
                    onClick= {() => navigate('/join')}
                    className="hidden md:block ml-4 px-12 rounded-2xl bg-[#febb00] hover:bg-[#e8a900] text-[#1e3c21] hover:text-[#0f1f15] font-bold hover:shadow-lg shadow-md transition-all duration-300">
                            Apply Now
                        </Button>

                    <Button 
                    onClick= {() => navigate('/join')}
                    className="md:hidden ml-4 px-6 rounded-xl bg-[#febb00] hover:bg-[#e8a900] text-[#1e3c21] hover:text-[#0f1f15] font-bold hover:shadow-lg shadow-md transition-all duration-300">
                            Apply
                        </Button>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                            aria-expanded="false"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isOpen ? (
                                <X className="block h-6 w-6" aria-hidden="true" />
                            ) : (
                                <Menu className="block h-6 w-6" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {isOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200 bg-white rounded-b-lg shadow-lg">
                            {navItems.map((item) => (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    className={
                                        'block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 text-gray-700 hover:text-primary-gold hover:bg-gray-50'
                                    }
                                    onClick={(e) => handleNavClick(e, item.href)}
                                >
                                    {item.name}
                                </a>
                            ))}
                            <div className="px-3 py-2">
                                <Button onClick={() => navigate('/join')} className="bg-[#febb00] text-[#1e3c21] font-bold hover:bg-[#e8a900] w-full">
                                    Apply Now
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </motion.header>
    );

}