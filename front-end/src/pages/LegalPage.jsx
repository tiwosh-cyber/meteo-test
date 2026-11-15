import { PageIntro } from '../components/ui.jsx';

// Phase 09 · LCEN (mentions légales) and GDPR information at collection. Public route.
// Content validated by the human on 15/11/2026; update docs/IMPLEMENTATION_PLAN.md § 11 if it changes.
const contact = <a href="mailto:contact@kizzkiss.com">contact@kizzkiss.com</a>;

export default function LegalPage() {
  return <>
    <PageIntro eyebrow="INFORMATIONS" title="Mentions légales et confidentialité">Qui édite ce site, où il est hébergé et ce que deviennent vos données.</PageIntro>
    <section className="form-card legal" aria-labelledby="legal-editor">
      <h2 id="legal-editor">Éditeur</h2>
      <p>METEO TEST est un site personnel, pédagogique et non commercial, édité par un particulier dont l’identité a été communiquée à l’hébergeur. Contact : {contact}.</p>
      <p>Les données météo affichées sont fictives et saisies manuellement : elles ne décrivent pas le temps réel.</p>
      <h2>Hébergement</h2>
      <p>Site : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.</p>
      <p>Comptes et données : Supabase Inc., serveurs situés dans l’Union européenne.</p>
      <h2>Données personnelles</h2>
      <p><strong>Données collectées :</strong> votre adresse email et votre mot de passe (conservé sous forme chiffrée par Supabase), ainsi que votre session de connexion.</p>
      <p><strong>Finalité et base légale :</strong> créer et sécuriser votre compte pour vous donner accès à la météo, en exécution du service que vous demandez (article 6.1.b du RGPD). Aucune utilisation commerciale, aucune prospection.</p>
      <p><strong>Durée de conservation :</strong> jusqu’à votre demande de suppression. Tous les comptes sont supprimés à la fin du test ou après 12 mois d’inactivité.</p>
      <p><strong>Destinataires :</strong> l’éditeur uniquement, avec deux sous-traitants techniques : Supabase (authentification et base de données, dans l’Union européenne) et Vercel (hébergement du site, États-Unis, avec les garanties contractuelles prévues par Vercel pour les transferts hors de l’Union européenne).</p>
      <p><strong>Vos droits :</strong> accès, rectification, effacement, limitation, opposition et portabilité. Écrivez à {contact} ; votre compte sera supprimé sur simple demande. Vous pouvez aussi adresser une réclamation à la CNIL (<a href="https://www.cnil.fr" rel="noreferrer">cnil.fr</a>).</p>
      <h2>Cookies et stockage</h2>
      <p>Aucun cookie publicitaire ni outil de mesure d’audience. Seul un jeton de connexion, indispensable au fonctionnement du compte, est enregistré dans votre navigateur ; il est effacé à la déconnexion.</p>
    </section>
  </>;
}
