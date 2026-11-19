use clap::Parser;

/// a basic calulator
///
/// a basic calculator in rust
#[derive(Parser)]
#[command(author, version, about, long_about = None)]
struct Cli {
    /// first number
    left: f64,
    /// operation +,-,*,/
    op: String,
    ///second number
    right: f64,
}

fn main() {
    let cli = Cli::parse();
    let result = match cli.op.as_str() {
        "+" => cli.left + cli.right,
        "-" => cli.left - cli.right,
        "*" => cli.left * cli.right,
        "/" => {
            if cli.right == 0.0 {
                f64::NAN
            } else {
                cli.left / cli.right
            }
        }
        _ => panic!("unknown operator"),
    };
    println!("{}", result);
}
