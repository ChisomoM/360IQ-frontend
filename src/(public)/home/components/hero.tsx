import { ArrowRight, CheckCircle, Zap, Award } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';


export default function Hero(){
    const highlights = [
        { icon: CheckCircle, text: "Accredited Degrees" },
        { icon: Zap, text: "Innovative Learning" },
        { icon: Award, text: "Global Recognition" }
    ];

    return(
        <div className="">      
          <section className="relative bg-[url('/campus.jpg')] bg-cover bg-center overflow-hidden min-h-[90vh] flex items-center">
            {/* Enhanced Overlay with UNILUS Green */}
            <div className='absolute inset-0 bg-[#1e3c21]/45'>
                {/* Animated Gradient Orbs */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#febb00]/15 rounded-full blur-3xl"
                ></motion.div>
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 2
                    }}
                    className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#1e3c21]/20 rounded-full blur-3xl"
                ></motion.div>
            </div>

            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 w-full z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left Column - Main Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-left space-y-8 pt-12 lg:pt-0"
                    >                       
                        {/* Admission Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="inline-flex items-center gap-2 bg-[#febb00]/20 backdrop-blur-md px-4 py-2 rounded-full border border-[#febb00]/50"
                        >
                            <Award className="text-[#febb00]" size={16} />
                            <span className="text-[#febb00] font-semibold text-sm">Admissions Open Now</span>
                        </motion.div>

                        {/* Main Headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight"
                        >
                            Transform Your{' '}
                            <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-[#febb00] via-yellow-300 to-[#febb00]">
                                Future at UNILUS
                            </span>
                        </motion.h1>

                        {/* Subheadline */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="text-lg text-gray-100 leading-relaxed max-w-2xl"
                        >
                            Excellence in higher education at the University of Lusaka. Unlock your potential through world-class academic programs and personal development.
                        </motion.p>

                        {/* Highlights */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                            className="flex flex-wrap gap-4"
                        >
                            {highlights.map((highlight, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                                    className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-full border border-white/20"
                                >
                                    <highlight.icon className="text-[#febb00]" size={16} />
                                    <span className="text-white font-medium text-sm">{highlight.text}</span>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.7 }}
                            className="flex flex-col sm:flex-row gap-4 pt-4"
                        >
                            <Link to="/join" className="group">
                                <Button 
                                    size="sm"
                                    className="w-full sm:w-auto bg-[#febb00] hover:bg-[#e8a900] text-[#1e3c21] font-bold px-10 py-7 text-lg rounded-2xl shadow-lg hover:shadow-lg transition-all duration-300"
                                >
                                    Apply Now
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <Button 
                                variant="outline" 
                                size="sm"
                                className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-[#1e3c21] font-semibold px-10 py-7 text-lg rounded-2xl transition-all duration-300 bg-transparent backdrop-blur-sm"
                            >
                                Learn More
                            </Button>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
          </section>
        </div>
    )
}