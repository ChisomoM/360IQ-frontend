// "use client";
import Hero from '@/(public)/home/components/hero';
import Navbar from '../../components/navbar';
import Footer  from '@/components/footer';
import TrustSignals from './components/TrustSignals';
import FeaturedPrograms from './components/FeaturedPrograms';



export default function Home(){
    return(
        <div className="min-h-screen flex flex-col">
            <Navbar/>
            <main className="flex-grow">
                <Hero/>
                <TrustSignals/>
                <FeaturedPrograms/>
            </main>
            <Footer/>
        </div>
        
        
    )
}