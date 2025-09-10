import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-white">Bricola LTD</h1>
        <p className="text-xl text-white/90 mb-8">Plateforme de location d'outils entre particuliers</p>
        <Link to="/admin/login">
          <Button className="bg-white text-primary hover:bg-white/90">
            Accéder à l'administration
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
