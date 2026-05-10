// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod vault;
mod git;
mod mcp;
mod commands;

fn main() {
    dev_it_lib::run()
}
