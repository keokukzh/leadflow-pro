import argparse
import os

def test_voice_call(phone, script):
    print(f"📞 Initiating Voice Call to {phone}...")
    print(f"📜 Using Script: {script}")
    
    scripts = {
        "cold_call": """
        Grüezi, hie isch dr Bottie vo LeadFlow Pro.
        Ich ha gwüsst, dass Sie sehr viele positive Bewertungen ha.
        Mir vo LeadFlow Pro mached professionelli Websites
        für Schweizer Unternehmen - gratis Website-Vorschau
        für Sie!
        Hänt Sie 5 Minute Zyt?
        """
    }
    
    content = scripts.get(script, "Grüezi, wie cha ich Ihne helfe?")
    print(f"🗣️ Bottie says: \"{content.strip()}\"")
    print("\n✅ Call successful (Simulated)")

def configure_voice(voice, language):
    print(f"⚙️ Configuring ElevenLabs...")
    print(f"🎙️ Voice: {voice}")
    print(f"🌍 Language: {language}")
    print("\n✅ Voice configuration saved")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bottie Voice Agent Controller")
    parser.add_argument("--phone", help="Phone number to call")
    parser.add_argument("--script", default="cold_call", help="Script to use")
    parser.add_argument("--voice", help="ElevenLabs Voice ID or Name")
    parser.add_argument("--language", default="de-CH", help="Language code")
    
    args = parser.parse_args()
    
    if args.phone:
        test_voice_call(args.phone, args.script)
    elif args.voice:
        configure_voice(args.voice, args.language)
    else:
        parser.print_help()
